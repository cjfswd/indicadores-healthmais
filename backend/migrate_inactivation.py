"""Migração: alta/óbito deixam de esconder o paciente.

Até agora, um evento de alta (01 / 1.1) ou óbito (04) disparava SOFT_DELETE no
paciente. Como todo `find` injeta `deletedAt: None`, o paciente inteiro sumia
das telas — junto com todos os eventos dele. O dado estava salvo, mas invisível.

Este script percorre os pacientes com `deletedAt` preenchido, identifica os que
foram escondidos por essa regra automática e os traz de volta, marcando-os como
`inactive: True`. Nada é apagado: o event store continua com todos os eventos, e
a reativação entra como um evento novo (REACTIVATE), preservando a trilha.

Uso:
    cd backend
    MONGO_URI="mongodb://..." DB_NAME="coringa_db" python migrate_inactivation.py
    MONGO_URI="mongodb://..." python migrate_inactivation.py --dry-run
"""
import asyncio
import sys

from core.database import (
    init_db, close_db, get_db, append_event, get_stream_events,
)
from routers.proxy import _inactivation_reason


async def migrar(dry_run: bool = False) -> None:
    await init_db()
    db = get_db()
    col = db["patients"]

    candidatos = await col.find({"deletedAt": {"$ne": None}}).to_list(length=100000)
    print(f"{len(candidatos)} paciente(s) com deletedAt preenchido.")

    reativados = 0
    mantidos = 0

    for doc in candidatos:
        doc_id = str(doc["_id"])
        eventos_store = await get_stream_events("patients", doc_id)
        soft_delete = next(
            (e for e in reversed(eventos_store) if e.get("eventType") == "SOFT_DELETE"),
            None,
        )
        motivo_registrado = (soft_delete or {}).get("data", {}).get("inactivationReason")

        # Se não houver motivo no evento, tenta deduzir pelos eventos do paciente.
        motivo = motivo_registrado
        if not motivo:
            for evt in (doc.get("events") or []):
                motivo = _inactivation_reason(evt)
                if motivo:
                    break

        if not motivo:
            # Exclusão manual de verdade: continua excluído.
            mantidos += 1
            continue

        print(f"  → {doc.get('name', doc_id)}: reativando (motivo: {motivo})")
        reativados += 1
        if dry_run:
            continue

        await append_event(
            stream_type="patients",
            stream_id=doc_id,
            event_type="REACTIVATE",
            data={"migration": "inactivation-v2"},
            actor="migration",
        )
        await append_event(
            stream_type="patients",
            stream_id=doc_id,
            event_type="UPDATE",
            data={"$set": {
                "inactive": True,
                "inactivationReason": motivo,
                "inactivatedAt": (soft_delete or {}).get("timestamp"),
            }},
            actor="migration",
        )

    print(
        f"\nResumo: {reativados} paciente(s) voltaram como inativos, "
        f"{mantidos} permanecem excluídos (exclusão manual)."
    )
    if dry_run:
        print("Modo dry-run: nada foi gravado.")

    await close_db()


if __name__ == "__main__":
    asyncio.run(migrar(dry_run="--dry-run" in sys.argv))
