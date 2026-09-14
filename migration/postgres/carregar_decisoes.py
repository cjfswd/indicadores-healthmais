# -*- coding: utf-8 -*-
"""Carrega no Postgres as decisoes de triagem da Fase 2.

    docker exec -it <backend> python /tmp/carregar_decisoes.py decisoes_triagem.json --dry-run
    docker exec -it <backend> python /tmp/carregar_decisoes.py decisoes_triagem.json

Por que existe: a pagina de Migracao do painel grava a decisao so no
localStorage de quem decide (chave "triagem-cards-v1"). Ela nunca sobe, entao
some ao trocar de maquina ou limpar os dados do site, e a carga do Postgres
nao a enxerga. Este script leva um despejo dessa chave para
painel.triagem_decisoes, onde a equipe inteira alcanca.

E idempotente: rodar de novo sobre as mesmas decisoes nao duplica nada, e uma
decisao revista sobrescreve a anterior.

Antes de gravar ele confere que todo evento citado existe em patient_events.
Decisao apontando para evento inexistente e defeito, nao detalhe: ou o dado
veio de outro banco, ou o evento foi apagado depois da triagem. Nesse caso o
script para e lista as chaves, sem escrever nada.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

CHAVE_LOCALSTORAGE = "triagem-cards-v1"
FORMATO_CHAVE = re.compile(r"^[0-9a-f]{24}(@[0-9A-Za-z.]{1,8})?$")
FORMATO_CODIGO = re.compile(r"^[0-9]{1,2}\.[A-Za-z0-9]{1,4}$")


def ler_decisoes(caminho):
    """Aceita o mapa cru ou o despejo do localStorage em volta dele.

    Quem exporta pelo console costuma trazer o objeto inteiro do storage, com
    a chave "triagem-cards-v1" guardando uma STRING de JSON. Exigir que a
    pessoa desembrulhe isso a mao so cria uma chance de errar na edicao.
    """
    bruto = json.loads(caminho.read_text(encoding="utf-8"))
    if isinstance(bruto, dict) and CHAVE_LOCALSTORAGE in bruto:
        bruto = bruto[CHAVE_LOCALSTORAGE]
    if isinstance(bruto, str):
        bruto = json.loads(bruto)
    if not isinstance(bruto, dict):
        raise SystemExit("Formato nao reconhecido: esperava um objeto {chave: codigo}.")
    return bruto


def partir(chave):
    """Separa a linha espelho: 'abc@03' -> ('abc', '03'); 'abc' -> ('abc', None)."""
    evento, _, card = chave.partition("@")
    return evento, (card or None)


def validar(decisoes):
    problemas = []
    for chave, codigo in decisoes.items():
        if not FORMATO_CHAVE.match(chave):
            problemas.append("chave fora do formato: %r" % (chave,))
        if not isinstance(codigo, str) or not FORMATO_CODIGO.match(codigo):
            problemas.append("codigo invalido em %s: %r" % (chave, codigo))
    return problemas


def carregar(uri, schema, decisoes, por, dry_run):
    import psycopg

    linhas = []
    for chave, codigo in sorted(decisoes.items()):
        evento, card = partir(chave)
        linhas.append((chave, evento, card, codigo))
    chaves = [linha[0] for linha in linhas]

    with psycopg.connect(uri, connect_timeout=15, autocommit=False) as conn:
        with conn.cursor() as cur:
            cur.execute("SET search_path TO " + schema)

            cur.execute("SELECT to_regclass('triagem_decisoes') IS NOT NULL")
            if not cur.fetchone()[0]:
                print("[ERRO] %s.triagem_decisoes nao existe. Rode antes: "
                      "psql $DATABASE_URL -v ON_ERROR_STOP=1 -f migracoes/004_triagem.sql"
                      % schema)
                return 1

            # Todo evento citado precisa existir. Conferir antes de escrever
            # evita a transacao morrer no meio por violacao de FK e deixar a
            # duvida de quanto entrou.
            ids = sorted(set(linha[1] for linha in linhas))
            cur.execute("SELECT id FROM patient_events WHERE id = ANY(%s)", (ids,))
            existem = set(r[0] for r in cur.fetchall())
            orfaos = [linha[0] for linha in linhas if linha[1] not in existem]
            if orfaos:
                print("[ERRO] %d decisao(oes) apontam para evento inexistente:" % len(orfaos))
                for chave in orfaos:
                    print("   ", chave)
                print("Nada foi gravado. Confira se o Postgres esta carregado "
                      "(carregar_do_mongo.py) e se a triagem saiu deste mesmo banco.")
                return 1

            cur.execute("SELECT count(*) FROM triagem_decisoes")
            antes = cur.fetchone()[0]

            cur.execute("SELECT chave, codigo FROM triagem_decisoes WHERE chave = ANY(%s)",
                        (chaves,))
            atual = dict(cur.fetchall())

            if dry_run:
                novas = [c for c in chaves if c not in atual]
                mudam = [(c, atual[c], cod) for c, _, _, cod in linhas
                         if c in atual and atual[c] != cod]
                print("[DRY-RUN] %d decisao(oes) no arquivo, %d ja na tabela."
                      % (len(linhas), antes))
                print("[DRY-RUN] %d entrariam novas, %d mudariam de codigo, %d ficariam iguais."
                      % (len(novas), len(mudam), len(linhas) - len(novas) - len(mudam)))
                for chave, de, para in mudam:
                    print("    %s: %s -> %s" % (chave, de, para))
                conn.rollback()
                return 0

            cur.executemany(
                "INSERT INTO triagem_decisoes "
                "  (chave, evento_id, card, codigo, decidido_por, decidido_em) "
                "VALUES (%s, %s, %s, %s, %s, now()) "
                "ON CONFLICT (chave) DO UPDATE SET "
                "  codigo = EXCLUDED.codigo, evento_id = EXCLUDED.evento_id, "
                "  card = EXCLUDED.card, decidido_por = EXCLUDED.decidido_por, "
                "  decidido_em = now()",
                [(c, ev, card, cod, por) for c, ev, card, cod in linhas])

            # Criterio de aceite: a tabela tem que conter exatamente o que o
            # arquivo trouxe. Conferir dentro da transacao permite desfazer.
            cur.execute("SELECT chave, codigo FROM triagem_decisoes WHERE chave = ANY(%s)",
                        (chaves,))
            gravado = dict(cur.fetchall())
            divergem = [c for c, _, _, cod in linhas if gravado.get(c) != cod]
            if divergem or len(gravado) != len(linhas):
                conn.rollback()
                print("[ERRO] Conferencia falhou: %d/%d gravadas, %d com codigo diferente. "
                      "Transacao desfeita." % (len(gravado), len(linhas), len(divergem)))
                return 1

            cur.execute("SELECT count(*) FROM triagem_decisoes")
            depois = cur.fetchone()[0]
        conn.commit()

    print("[OK] %d decisao(oes) carregadas. Tabela: %d -> %d linha(s)."
          % (len(linhas), antes, depois))
    print("[OK] Por codigo:", dict(sorted(Counter(decisoes.values()).items())))
    return 0


def main():
    p = argparse.ArgumentParser(
        description="Carrega as decisoes de triagem no Postgres.")
    p.add_argument("arquivo", type=Path,
                   help="JSON com as decisoes (mapa cru ou despejo do localStorage)")
    p.add_argument("--dry-run", action="store_true",
                   help="confere e mostra o que mudaria, sem gravar")
    p.add_argument("--por", default=os.getenv("TRIAGEM_POR", ""),
                   help="email de quem decidiu (vai para decidido_por)")
    args = p.parse_args()

    if not args.arquivo.is_file():
        print("[ERRO] Arquivo nao encontrado: %s" % args.arquivo)
        return 1

    uri = os.getenv("POSTGRES_URI", "").strip()
    if not uri:
        print("[ERRO] POSTGRES_URI ausente. Rode dentro do container do backend, "
              "que ja tem a variavel.")
        return 1
    schema = os.getenv("POSTGRES_SCHEMA", "painel")
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", schema):
        print("[ERRO] POSTGRES_SCHEMA invalido: %r" % (schema,))
        return 1

    decisoes = ler_decisoes(args.arquivo)
    if not decisoes:
        print("[ERRO] Arquivo sem nenhuma decisao.")
        return 1

    problemas = validar(decisoes)
    if problemas:
        print("[ERRO] %d problema(s) no arquivo:" % len(problemas))
        for m in problemas:
            print("   ", m)
        return 1

    print("[INFO] %d decisao(oes) lidas de %s." % (len(decisoes), args.arquivo))
    return carregar(uri, schema, decisoes, args.por, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
