# -*- coding: utf-8 -*-
"""Carrega o data.sql num Postgres remoto e confere o resultado.

    python carregar_remoto.py "postgresql://user:senha@host:porta/postgres" data.sql

Existe para nao precisar de `psql` instalado: usa o psycopg, que ja e
dependencia do backend. Sincrono de proposito -- a versao async do psycopg nao
roda no event loop padrao do Windows, e aqui isso seria estorvo sem ganho.

A senha nunca aparece na saida. Mas ela fica no historico do shell quando vai
na linha de comando: prefira exportar POSTGRES_URI e chamar sem o primeiro
argumento.
"""
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import psycopg

ESPERADO_CARDS = {"01": 28, "02": 13, "03": 11, "04": 3, "05": 24,
                  "06": 79, "07": 1, "08": 7, "09": 39, "10": 1}
ESPERADO_SITUACAO = {"ativo": 80, "inativo": 12, "excluido": 50}
ESPERADO_TOTAIS = (142, 206, 972)


def mascarar(uri: str) -> str:
    p = urlsplit(uri)
    if p.password:
        porta = f":{p.port}" if p.port else ""
        p = p._replace(netloc=f"{p.username or ''}:***@{p.hostname or ''}{porta}")
    return urlunsplit(p)


def main() -> int:
    args = [a for a in sys.argv[1:]]
    uri = os.getenv("POSTGRES_URI", "").strip()
    if args and args[0].startswith("postgres"):
        uri = args.pop(0)
    arquivo = Path(args[0]) if args else Path("data.sql")

    if not uri:
        print("uso: python carregar_remoto.py <uri> <data.sql>")
        print("  ou: POSTGRES_URI=... python carregar_remoto.py <data.sql>")
        return 1
    if not arquivo.is_file():
        print(f"nao encontrei {arquivo}")
        return 1

    schema = os.getenv("POSTGRES_SCHEMA", "painel")
    sql = arquivo.read_text(encoding="utf-8")
    print(f"destino : {mascarar(uri)}  (schema {schema})")
    print(f"carga   : {arquivo}  ({len(sql):,} bytes)".replace(",", "."))

    # autocommit para o BEGIN/COMMIT de dentro do data.sql ser o que manda.
    # Sem isto o psycopg abre a propria transacao, o BEGIN do arquivo vira
    # aviso de transacao aninhada e fica ambiguo quem controla o rollback.
    with psycopg.connect(uri, connect_timeout=15, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {schema}")
            cur.execute("SELECT to_regclass('patients') IS NOT NULL")
            if not cur.fetchone()[0]:
                print(f"\nO schema '{schema}' nao tem as tabelas. "
                      "Rode a Parte 3 (001_base.sql) antes desta carga.")
                return 1
            cur.execute("SELECT count(*) FROM patients")
            ja_tem = cur.fetchone()[0]
            if ja_tem:
                # Recarregar por cima violaria as chaves primarias e abortaria
                # a transacao no meio -- melhor parar aqui e dizer por que.
                print(f"\nJa existem {ja_tem} pacientes em {schema}. "
                      "A carga e para banco vazio; limpe antes de repetir.")
                return 1

            # O data.sql traz seu proprio BEGIN/COMMIT: se algo falhar no meio,
            # nada entra. Por isso vai inteiro, numa execucao so.
            print("\ncarregando...")
            cur.execute(sql)

    print("carregado. conferindo contra a origem:\n")
    falhas = []
    with psycopg.connect(uri, connect_timeout=15) as conn:
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {schema}")

            cur.execute(r"""SELECT substring(i.name from '^\s*(\d+)'), count(*)::int
                            FROM patient_events e
                            JOIN indicators i ON i.id = e.indicator_id
                            GROUP BY 1 ORDER BY 1""")
            cards = dict(cur.fetchall())
            for code, n in sorted(ESPERADO_CARDS.items()):
                obtido = cards.get(code)
                if obtido != n:
                    falhas.append(f"card {code}: esperado {n}, obtido {obtido}")
            print("  cards  " + "  ".join(
                f"{c}={cards.get(c, 0)}" for c in sorted(ESPERADO_CARDS)))

            cur.execute("SELECT situacao, count(*)::int FROM patients GROUP BY 1")
            sit = dict(cur.fetchall())
            for k, n in ESPERADO_SITUACAO.items():
                if sit.get(k) != n:
                    falhas.append(f"{k}: esperado {n}, obtido {sit.get(k)}")
            print("  situacao  " + "  ".join(f"{k}={v}" for k, v in sorted(sit.items())))
            if sit.get("excluido") == 61:
                print("     -> 61 excluidos = carga sem a migracao de inativacao")

            cur.execute("""SELECT (SELECT count(*) FROM patients),
                                  (SELECT count(*) FROM patient_events),
                                  (SELECT count(*) FROM events_store)""")
            totais = tuple(cur.fetchone())
            if totais != ESPERADO_TOTAIS:
                falhas.append(f"totais: esperado {ESPERADO_TOTAIS}, obtido {totais}")
            print(f"  totais  pacientes={totais[0]} eventos={totais[1]} auditoria={totais[2]}")

    print()
    if falhas:
        for f in falhas:
            print("  FALHA " + f)
        return 1
    print("carga confere com a origem.")
    print("\nAgora DESLIGUE a porta publica do Postgres no Coolify.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
