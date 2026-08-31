# -*- coding: utf-8 -*-
"""Carrega o Postgres lendo o Mongo direto, de dentro do servidor.

Roda no container do backend, que e o unico lugar que alcanca os dois bancos e
ja tem os dois drivers: `motor` (que traz o pymongo junto) e `psycopg`.

    docker exec -it <backend> python /tmp/carregar_do_mongo.py

Por que existe: o caminho anterior era exportar o Mongo, transformar na
maquina de quem opera e subir um data.sql de 800 KB de volta. Esse arquivo
carrega nome de paciente e observacao clinica, entao nao pode ir por URL
publica nem por repositorio -- e sobrava colar em pedacos ou abrir SSH.

Mas o dado nunca precisou sair: ele ja esta no servidor, no Mongo, ao lado do
Postgres. Aqui ele nao trafega, nao e colado e nao e publicado.

As transformacoes e a validacao nao sao reescritas: o etl.py e baixado e usado
como modulo. Ele e codigo, publico, e continua sendo a unica definicao das
regras -- duas copias divergiriam.
"""
import getpass
import hashlib
import importlib.util
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.request
from pathlib import Path

CRU = "https://raw.githubusercontent.com/cjfswd/indicadores-healthmais/main/migration/postgres/"
PRECISA = ["etl.py", "schema.sql"]

# Fotografia do dump de 28/08. NAO e criterio de aceite: o Mongo e vivo, e uma
# diferenca aqui costuma ser gente trabalhando, nao defeito. Serve so para
# dizer o que mudou desde entao.
REFERENCIA_2608 = {"01": 28, "02": 13, "03": 11, "04": 3, "05": 24,
                   "06": 79, "07": 1, "08": 7, "09": 39, "10": 1}


def contar_por_card(linhas: dict) -> dict:
    """Eventos por card, contados do que o ETL acabou de gerar.

    Esta e a unica referencia valida para conferir a carga: o Postgres tem que
    conter exatamente o que saiu do Mongo agora. Comparar com numeros fixos de
    um dump antigo acusa como falha o sistema estar sendo usado.
    """
    nome = {t[0]: t[1] for t in linhas["indicators"]}
    cards = {}
    for ev in linhas["patient_events"]:
        achado = re.match(r"^\s*(\d+)", nome.get(ev[2], ""))
        if achado:
            cards[achado.group(1)] = cards.get(achado.group(1), 0) + 1
    return cards


def baixar(destino: Path) -> None:
    for nome in PRECISA:
        dados = urllib.request.urlopen(CRU + nome, timeout=30).read()
        (destino / nome).write_bytes(dados)
        print(f"  {nome:12} {len(dados):>7} bytes  sha256 "
              f"{hashlib.sha256(dados).hexdigest()[:16]}...")


def despejar_mongo(destino: Path) -> dict:
    """Escreve as colecoes no mesmo formato que o mongoexport produz.

    O etl.py le `<colecao>.json` em JSON Lines com extended JSON relaxado --
    `{"$oid": ...}` e `{"$date": ...}`. E o que o json_util devolve, entao o
    ETL nao percebe diferenca entre isto e o export feito a mao.
    """
    from bson import json_util
    from pymongo import MongoClient

    uri = os.getenv("MONGO_URI", "")
    banco = os.getenv("DB_NAME", "coringa_db")
    if not uri or uri.strip().lower() in ("", "memory"):
        raise SystemExit("MONGO_URI ausente ou em memoria: nada para ler.")

    cliente = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = cliente[banco]
    presentes = set(db.list_collection_names())

    etl = sys.modules["etl"]
    contagem = {}
    for colecao in etl.COLLECTIONS:
        if colecao not in presentes:
            raise SystemExit(f"colecao ausente no Mongo: {colecao}")
        docs = list(db[colecao].find())
        with (destino / f"{colecao}.json").open("w", encoding="utf-8") as fh:
            for d in docs:
                fh.write(json_util.dumps(
                    d, json_options=json_util.RELAXED_JSON_OPTIONS) + "\n")
        contagem[colecao] = len(docs)
        print(f"  {colecao:20} {len(docs):>6}")

    # Sobra que o export manual deixou passar uma vez: uma colecao que existe
    # no Mongo e nao esta em COLLECTIONS some sem aviso. Melhor dizer.
    ignoradas = presentes - set(etl.COLLECTIONS)
    if ignoradas:
        print("  (nao lidas: " + ", ".join(sorted(ignoradas)) + ")")
    cliente.close()
    return contagem


def carregar(uri: str, schema: str, sql: str, linhas: dict) -> int:
    import psycopg

    with psycopg.connect(uri, connect_timeout=15, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {schema}")
            cur.execute("SELECT to_regclass('patients') IS NOT NULL")
            if not cur.fetchone()[0]:
                print(f"\nO schema '{schema}' esta vazio. Aplique a 001_base antes.")
                return 1
            cur.execute("SELECT count(*) FROM patients")
            ja = cur.fetchone()[0]
            if ja:
                print(f"\nJa existem {ja} pacientes em {schema}. "
                      "A carga e para banco vazio.")
                return 1
            print("\ncarregando...")
            cur.execute(sql)

            falhas = []
            # 1. Toda linha gerada tem que estar la. E o criterio de aceite.
            for tabela, geradas in sorted(linhas.items()):
                cur.execute(f"SELECT count(*) FROM {tabela}")
                no_banco = cur.fetchone()[0]
                if no_banco != len(geradas):
                    falhas.append(
                        f"{tabela}: gerou {len(geradas)}, gravou {no_banco}")

            cur.execute(r"""SELECT substring(i.name from '^\s*(\d+)'), count(*)::int
                            FROM patient_events e
                            JOIN indicators i ON i.id = e.indicator_id
                            GROUP BY 1 ORDER BY 1""")
            cards = dict(cur.fetchall())
            da_fonte = contar_por_card(linhas)
            for c, n in da_fonte.items():
                if cards.get(c) != n:
                    falhas.append(f"card {c}: gerou {n}, gravou {cards.get(c)}")

            cur.execute("SELECT situacao, count(*)::int FROM patients GROUP BY 1")
            sit = dict(cur.fetchall())
            print("  cards  " + "  ".join(
                f"{c}={cards.get(c, 0)}" for c in sorted(set(cards) | set(da_fonte))))
            print("  situacao  " + "  ".join(f"{k}={v}" for k, v in sorted(sit.items())))

            if falhas:
                print()
                for f in falhas:
                    print("  FALHA " + f)
                print("\nO Postgres nao contem o que o ETL gerou. Isto e defeito.")
                return 1

            # 2. Diferenca para 28/08: informacao, nao falha.
            mudou = {c: (REFERENCIA_2608.get(c, 0), n)
                     for c, n in sorted(da_fonte.items())
                     if REFERENCIA_2608.get(c, 0) != n}
            if mudou:
                print("\n  desde o dump de 28/08:")
                for c, (antes, agora) in mudou.items():
                    print(f"    card {c}: {antes} -> {agora}  ({agora - antes:+d})")
                print("  O Mongo e vivo; isto e o sistema em uso, nao defeito.")
    return 0


def main() -> int:
    uri_pg = os.getenv("POSTGRES_URI", "").strip()
    if len(sys.argv) > 1:
        uri_pg = sys.argv[1]
    if not uri_pg:
        # getpass para a senha nao ficar no historico do shell nem na lista de
        # processos, que e onde ela vazaria se viesse por argumento.
        uri_pg = getpass.getpass("URI do Postgres (nao aparece na tela): ").strip()
    if not uri_pg:
        print("sem URI do Postgres.")
        return 1

    schema = os.getenv("POSTGRES_SCHEMA", "painel")
    # Tudo abaixo carrega dado de paciente e e apagado no finally.
    trabalho = Path(tempfile.mkdtemp(prefix="carga-"))
    try:
        print("baixando o ETL do repositorio:")
        baixar(trabalho)

        spec = importlib.util.spec_from_file_location("etl", trabalho / "etl.py")
        etl = importlib.util.module_from_spec(spec)
        sys.modules["etl"] = etl
        spec.loader.exec_module(etl)

        print("\nlendo o Mongo:")
        despejar_mongo(trabalho)

        print("\ntransformando:")
        linhas, stats = etl.transformar(trabalho)
        etl.validar(linhas, stats, (trabalho / "schema.sql").read_text(encoding="utf-8"))

        destino = trabalho / "data.sql"
        etl.emitir(linhas, destino)
        sql = destino.read_text(encoding="utf-8")
        print(f"\nSQL gerado: {len(sql)} bytes")

        codigo = carregar(uri_pg, schema, sql, linhas)
        if codigo == 0:
            print("\ncarga confere com a origem.")
        return codigo
    finally:
        shutil.rmtree(trabalho, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
