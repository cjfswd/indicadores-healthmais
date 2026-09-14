# -*- coding: utf-8 -*-
"""Diz se os eventos da fonte ja estao no Postgres. So le, nunca escreve.

    docker exec -it <backend> python /tmp/conferir_eventos.py
    python conferir_eventos.py --de backup/patients.json

Por que existe: antes de rodar qualquer carga a pergunta e "isto ja esta la?".
O carregar_do_mongo.py se recusa a rodar em base populada, entao ele nao
duplica -- mas recusar nao responde quanto ja entrou, nem se a fonte ganhou
evento novo depois da ultima carga. Este script responde, sem tocar em nada.

A comparacao e por id: patient_events.id e o proprio _id do evento embutido em
patients.events no Mongo (etl.py), entao os dois lados usam a mesma chave e um
id em comum e o mesmo evento, nao uma coincidencia.

A fonte pode ser o Mongo (padrao, precisa de MONGO_URI) ou um patients.json em
JSON Lines, no formato do mongoexport -- util para conferir contra um dump sem
alcancar o banco de origem.
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path


def ids_do_arquivo(caminho):
    """Le patients.json em JSON Lines e devolve {evento_id: paciente_id}."""
    eventos = {}
    with caminho.open(encoding="utf-8") as fh:
        for numero, linha in enumerate(fh, start=1):
            linha = linha.strip()
            if not linha:
                continue
            try:
                doc = json.loads(linha)
            except json.JSONDecodeError as e:
                raise SystemExit("linha %d de %s nao e JSON: %s" % (numero, caminho, e))
            pid = doc.get("_id")
            if isinstance(pid, dict):          # extended JSON: {"$oid": "..."}
                pid = pid.get("$oid")
            for ev in doc.get("events") or []:
                eid = ev.get("_id")
                if isinstance(eid, dict):
                    eid = eid.get("$oid")
                if eid:
                    eventos[str(eid)] = str(pid)
    return eventos


def ids_do_mongo():
    from pymongo import MongoClient

    uri = os.getenv("MONGO_URI", "")
    banco = os.getenv("DB_NAME", "coringa_db")
    if not uri or uri.strip().lower() in ("", "memory"):
        raise SystemExit("MONGO_URI ausente ou em memoria: nada para ler. "
                         "Rode no container do backend, ou use --de <patients.json>.")
    cliente = MongoClient(uri, serverSelectionTimeoutMS=10000)
    eventos = {}
    for doc in cliente[banco]["patients"].find({}, {"events._id": 1}):
        for ev in doc.get("events") or []:
            if ev.get("_id"):
                eventos[str(ev["_id"])] = str(doc["_id"])
    cliente.close()
    return eventos


def ids_do_postgres(schema):
    import psycopg

    uri = os.getenv("POSTGRES_URI", "").strip()
    if not uri:
        raise SystemExit("POSTGRES_URI ausente. Rode no container do backend.")
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", schema):
        raise SystemExit("POSTGRES_SCHEMA invalido: %r" % (schema,))
    with psycopg.connect(uri, connect_timeout=15) as conn:
        with conn.cursor() as cur:
            cur.execute("SET search_path TO " + schema)
            cur.execute("SELECT to_regclass('patient_events') IS NOT NULL")
            if not cur.fetchone()[0]:
                raise SystemExit("%s.patient_events nao existe: aplique a 001_base antes."
                                 % schema)
            cur.execute("SELECT id FROM patient_events")
            return set(r[0] for r in cur.fetchall())


def amostra(conjunto, quantos=10):
    ordenado = sorted(conjunto)
    if len(ordenado) <= quantos:
        return ordenado
    return ordenado[:quantos] + ["... e mais %d" % (len(ordenado) - quantos)]


def main():
    p = argparse.ArgumentParser(
        description="Confere, sem escrever, se os eventos da fonte ja estao no Postgres.")
    p.add_argument("--de", type=Path, metavar="patients.json",
                   help="le a fonte de um dump em JSON Lines em vez do Mongo")
    p.add_argument("--decisoes", type=Path, default=Path(__file__).with_name("decisoes_triagem.json"),
                   help="arquivo de decisoes a conferir junto (padrao: decisoes_triagem.json)")
    args = p.parse_args()

    if args.de:
        if not args.de.is_file():
            print("[ERRO] Arquivo nao encontrado: %s" % args.de)
            return 1
        fonte = ids_do_arquivo(args.de)
        rotulo = "dump %s" % args.de
    else:
        fonte = ids_do_mongo()
        rotulo = "Mongo"

    destino = ids_do_postgres(os.getenv("POSTGRES_SCHEMA", "painel"))

    ids_fonte = set(fonte)
    ambos = ids_fonte & destino
    so_fonte = ids_fonte - destino
    so_destino = destino - ids_fonte

    print("Fonte (%s):      %5d eventos em %d paciente(s)"
          % (rotulo, len(ids_fonte), len(set(fonte.values()))))
    print("Destino (Postgres): %5d eventos" % len(destino))
    print("  ja migrados:      %5d" % len(ambos))
    print("  so na fonte:      %5d   <- seriam inseridos numa carga" % len(so_fonte))
    print("  so no destino:    %5d   <- nao existem mais na fonte" % len(so_destino))

    if so_fonte:
        print("\n  Ainda fora do Postgres:")
        for eid in amostra(so_fonte):
            print("   ", eid, "(paciente %s)" % fonte[eid] if eid in fonte else "")
    if so_destino:
        print("\n  No Postgres e nao na fonte:")
        for eid in amostra(so_destino):
            print("   ", eid)

    if args.decisoes.is_file():
        bruto = json.loads(args.decisoes.read_text(encoding="utf-8"))
        if isinstance(bruto, dict) and "triagem-cards-v1" in bruto:
            bruto = bruto["triagem-cards-v1"]
        if isinstance(bruto, str):
            bruto = json.loads(bruto)
        alvos = set(chave.split("@")[0] for chave in bruto)
        print("\nDecisoes de triagem (%s):" % args.decisoes.name)
        print("  %d decisao(oes) sobre %d evento(s)" % (len(bruto), len(alvos)))
        print("  presentes no Postgres: %d" % len(alvos & destino))
        faltando = alvos - destino
        if faltando:
            print("  AUSENTES no Postgres:  %d -- a carga das decisoes vai recusar"
                  % len(faltando))
            for eid in amostra(faltando):
                print("   ", eid)

    print()
    if not so_fonte:
        print("VEREDITO: nada a migrar -- todo evento da fonte ja esta no Postgres.")
    else:
        print("VEREDITO: %d evento(s) da fonte ainda nao estao no Postgres." % len(so_fonte))
    return 0


if __name__ == "__main__":
    sys.exit(main())
