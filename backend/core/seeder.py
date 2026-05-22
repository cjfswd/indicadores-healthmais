from bson import ObjectId
from core.database import append_event, EVENT_STORE_COLLECTION
from seed_data import (
    default_operators, default_indicators, default_patients
)


async def seed_database(db):
    """Seeds via Event Sourcing: cada registro é criado como um evento CREATE."""

    # Removemos o early return para permitir que novos operators (como "Particular")
    # e novos indicadores sejam semeados em bancos já existentes.
    # O guard interno em cada categoria cuidará de evitar duplicatas.
    operator_ids = {}

    print("[SEED] Seeding database via Event Sourcing...")

    # ─── Operators ────────────────────────────────────────────────
    for op in default_operators:
        # Guard: verifica se operadora já existe
        existing = await db.operators.find_one({"name": op["name"], "deletedAt": None})
        if existing:
            operator_ids[op["name"]] = str(existing["_id"])
            print(f"[SEED] Operator '{op['name']}' já existe, pulando...")
            continue

        op_id = str(ObjectId())
        await append_event(
            stream_type="operators",
            stream_id=op_id,
            event_type="CREATE",
            data={**op},
            actor="system-seeder"
        )

    # ─── Indicators ───────────────────────────────────────────────
    for ind in default_indicators:
        # Guard: verifica se indicador já existe
        existing_ind = await db.indicators.find_one({"name": ind["name"], "deletedAt": None})
        if existing_ind:
            print(f"[SEED] Indicator '{ind['name']}' já existe, pulando...")
            continue

        ind_id = str(ObjectId())
        await append_event(
            stream_type="indicators",
            stream_id=ind_id,
            event_type="CREATE",
            data={**ind},
            actor="system-seeder"
        )

    # ─── Patients ─────────────────────────────────────────────────
    camperj_id = operator_ids.get("Camperj")
    unimed_id = operator_ids.get("Unimed")

    # Busca snapshots dos operators para pegar o ref completo
    camperj_op = await db.operators.find_one({"_id": ObjectId(camperj_id)}) if camperj_id else None
    unimed_op = await db.operators.find_one({"_id": ObjectId(unimed_id)}) if unimed_id else None

    if camperj_op:
        for name in camperj_patients:
            existing = await db.patients.find_one({"name": name, "deletedAt": None})
            if existing:
                continue
            pat_id = str(ObjectId())
            await append_event(
                stream_type="patients",
                stream_id=pat_id,
                event_type="CREATE",
                data={
                    "name": name,
                    "operator": {"_id": str(camperj_op["_id"]), "name": camperj_op["name"]},
                    "admissionDate": "",
                    "birthDate": "",
                    "observations": "",
                    "events": [],
                },
                actor="system-seeder"
            )

    if unimed_op:
        for name in unimed_patients:
            existing = await db.patients.find_one({"name": name, "deletedAt": None})
            if existing:
                continue
            pat_id = str(ObjectId())
            await append_event(
                stream_type="patients",
                stream_id=pat_id,
                event_type="CREATE",
                data={
                    "name": name,
                    "operator": {"_id": str(unimed_op["_id"]), "name": unimed_op["name"]},
                    "admissionDate": "",
                    "birthDate": "",
                    "observations": "",
                    "events": [],
                },
                actor="system-seeder"
            )

    print("[SEED] Database seeding completed via Event Sourcing.")
