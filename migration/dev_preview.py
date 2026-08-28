"""Sobe o backend em memoria carregado com o export JA MIGRADO.

Serve para ver na interface real o efeito da migracao de inativacao antes de
aplicar qualquer coisa em producao: os pacientes de alta/obito aparecem em
/pacientes-inativos em vez de sumir.

    cd migration
    ../.venv/Scripts/python.exe -m uvicorn dev_preview:app --port 8000

Nada toca o Mongo de producao: USE_IN_MEMORY_DB=true usa mongomock, e o banco
morre junto com o processo.
"""
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

AQUI = Path(__file__).resolve().parent
BACKEND = AQUI.parent / "backend"
EXPORT = Path(os.getenv("EXPORT_DIR", r"C:\Users\Usuario\Downloads\export\export-2026-08-28"))

os.environ["USE_IN_MEMORY_DB"] = "true"
os.environ.setdefault("JWT_SECRET", "coringa_secret_key")

sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(AQUI / "postgres"))

import json  # noqa: E402
from bson import ObjectId  # noqa: E402

import main as app_main  # noqa: E402
from core.database import get_db  # noqa: E402
from etl import motivo_inativacao  # noqa: E402  (mesma regra do import Postgres)

COLLECTIONS = ["operators", "users", "indicators", "patients", "notifications", "events_store"]


def desconverter(v):
    """JSON do mongoexport -> tipos nativos do Mongo."""
    if isinstance(v, dict):
        if "$oid" in v:
            return ObjectId(v["$oid"])
        if "$date" in v:
            return datetime.fromisoformat(v["$date"].replace("Z", "+00:00"))
        return {k: desconverter(x) for k, x in v.items()}
    if isinstance(v, list):
        return [desconverter(x) for x in v]
    return v


def ler(nome: str) -> list:
    arq = EXPORT / (nome + ".json")
    with arq.open(encoding="utf-8") as fh:
        return [desconverter(json.loads(l)) for l in fh if l.strip()]


def migrar_inativacao(pacientes: list, event_store: list) -> dict:
    """Mesma regra de backend/migrate_inactivation.py, aplicada na carga."""
    soft_delete = {}
    for e in event_store:
        if e.get("streamType") == "patients" and e.get("eventType") == "SOFT_DELETE":
            soft_delete[e["streamId"]] = e

    stats = {"inativados": 0, "mantidos": 0}
    for p in pacientes:
        if not p.get("deletedAt") or p.get("inactive"):
            continue
        sd = soft_delete.get(str(p["_id"]))
        motivo = ((sd or {}).get("data") or {}).get("inactivationReason")
        if not motivo:
            for ev in (p.get("events") or []):
                motivo = motivo_inativacao(ev)
                if motivo:
                    break
        if motivo:
            p["deletedAt"] = None
            p["inactive"] = True
            p["inactivationReason"] = motivo
            p.setdefault("inactivatedAt", (sd or {}).get("timestamp"))
            stats["inativados"] += 1
        else:
            stats["mantidos"] += 1
    return stats


async def carregar(db):
    docs = {c: ler(c) for c in COLLECTIONS}
    stats = migrar_inativacao(docs["patients"], docs["events_store"])

    for nome, registros in docs.items():
        for r in registros:
            # Todo find do app injeta deletedAt: None; a chave precisa existir.
            r.setdefault("deletedAt", None)
        if registros:
            await db[nome].insert_many(registros)

    print("[DEV] carregado do export: " + ", ".join(
        "%s=%d" % (n, len(r)) for n, r in docs.items()))
    print("[DEV] migracao de inativacao: %d inativados, %d seguem excluidos"
          % (stats["inativados"], stats["mantidos"]))


async def _sem_seed(db):
    print("[DEV] seed padrao desativado: a base vem do export migrado")


# O seed do app recriaria operadoras e indicadores padrao, duplicando os do
# export. Trocado por um no-op antes do lifespan rodar.
app_main.seed_database = _sem_seed

_original = app_main.app.router.lifespan_context


@asynccontextmanager
async def lifespan(app):
    async with _original(app):
        await carregar(get_db())
        yield


app_main.app.router.lifespan_context = lifespan
app = app_main.app
