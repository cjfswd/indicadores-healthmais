from bson import ObjectId
from core.database import append_event, EVENT_STORE_COLLECTION
from seed_data import (
    default_operators, default_indicators, camperj_patients, unimed_patients
)


async def seed_database(db):
    """Seeds via Event Sourcing: cada registro é criado como um evento CREATE."""

    events_count = await db[EVENT_STORE_COLLECTION].count_documents({})
    if events_count > 0:
        print("[SEED] Event store already populated. Skipping...")
        return

    print("[SEED] Seeding database via Event Sourcing...")

    # ─── Operators ────────────────────────────────────────────────
    operator_ids = {}
    for op in default_operators:
        op_id = str(ObjectId())
        await append_event(
            stream_type="operators",
            stream_id=op_id,
            event_type="CREATE",
            data={**op},
            actor="system-seeder"
        )
        operator_ids[op["name"]] = op_id

    # ─── Indicators ───────────────────────────────────────────────
    for ind in default_indicators:
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
