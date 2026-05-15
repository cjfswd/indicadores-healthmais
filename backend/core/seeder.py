from bson import ObjectId
from core.database import append_event, EVENT_STORE_COLLECTION
from seed_data import (
    default_operators, default_indicators, default_patients
)


async def seed_database(db):
    """Seeds via Event Sourcing: cada registro é criado como um evento CREATE."""

    events_count = await db[EVENT_STORE_COLLECTION].count_documents({})
    if events_count > 0:
        print("[SEED] Event store already populated. Skipping...")
        return

    print("[SEED] Seeding database via Event Sourcing...")

    # ─── Operators ────────────────────────────────────────────────
    for op in default_operators:
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
        ind_id = str(ObjectId())
        await append_event(
            stream_type="indicators",
            stream_id=ind_id,
            event_type="CREATE",
            data={**ind},
            actor="system-seeder"
        )

    # ─── Patients ─────────────────────────────────────────────────
    for name in default_patients:
        pat_id = str(ObjectId())
        await append_event(
            stream_type="patients",
            stream_id=pat_id,
            event_type="CREATE",
            data={
                "name": name,
                "admissionDate": "",
                "birthDate": "",
                "observations": "",
                "events": [],
            },
            actor="system-seeder"
        )

    print("[SEED] Database seeding completed via Event Sourcing.")
