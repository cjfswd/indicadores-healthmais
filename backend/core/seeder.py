from bson import ObjectId
from core.database import append_event, EVENT_STORE_COLLECTION
from seed_data import (
    default_operators, default_indicators
)


async def seed_database(db):
    """Seeds via Event Sourcing: cada registro é criado como um evento CREATE."""

    # Verificação rápida: se todos os operators e indicators esperados já existem, pula.
    existing_ops = await db.operators.count_documents({"deletedAt": None})
    existing_inds = await db.indicators.count_documents({"deletedAt": None})

    if existing_ops >= len(default_operators) and existing_inds >= len(default_indicators):
        print("[SEED] All seed data present. Skipping...")
        return

    print("[SEED] Seeding missing data...")

    # ─── Operators ────────────────────────────────────────────────
    for op in default_operators:
        # Guard: verifica se operadora já existe
        existing = await db.operators.find_one({"name": op["name"], "deletedAt": None})
        if existing:
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
    # Desativado a pedido do usuário para evitar duplicatas em produção.
    # Pacientes devem ser cadastrados manualmente pela interface.

    print("[SEED] Database seeding completed via Event Sourcing.")
