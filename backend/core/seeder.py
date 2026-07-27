from bson import ObjectId
from core.database import append_event, EVENT_STORE_COLLECTION
from seed_data import (
    default_operators, default_indicators
)


async def seed_database(db):
    """Seeds via Event Sourcing: cada registro é criado como um evento CREATE.

    Roda em todo startup do backend (não só na base vazia): indicadores que já
    existem são checados e ganham automaticamente os subindicadores novos que
    ainda não têm (por nome), sem remover ou alterar os que já existem — assim
    o histórico retroativo nunca é afetado.
    """

    print("[SEED] Verificando seed data...")

    # ─── Operators ────────────────────────────────────────────────
    for op in default_operators:
        # Guard: verifica se operadora já existe
        existing = await db.operators.find_one({"name": op["name"], "deletedAt": None})
        if existing:
            continue

        op_id = str(ObjectId())
        await append_event(
            stream_type="operators",
            stream_id=op_id,
            event_type="CREATE",
            data={**op},
            actor="system-seeder"
        )
        print(f"[SEED] Operator '{op['name']}' criado.")

    # ─── Indicators ───────────────────────────────────────────────
    for ind in default_indicators:
        existing_ind = await db.indicators.find_one({"name": ind["name"], "deletedAt": None})

        if not existing_ind:
            ind_id = str(ObjectId())
            await append_event(
                stream_type="indicators",
                stream_id=ind_id,
                event_type="CREATE",
                data={**ind},
                actor="system-seeder"
            )
            print(f"[SEED] Indicator '{ind['name']}' criado.")
            continue

        # Indicador já existe: adiciona só os subindicadores novos (por nome),
        # preservando os existentes intactos para não quebrar o histórico.
        existing_subs = existing_ind.get("subindicators") or []
        existing_sub_names = {s.get("name") for s in existing_subs}
        missing_subs = [s for s in ind.get("subindicators", []) if s["name"] not in existing_sub_names]

        if missing_subs:
            await append_event(
                stream_type="indicators",
                stream_id=str(existing_ind["_id"]),
                event_type="UPDATE",
                data={"subindicators": [*existing_subs, *missing_subs]},
                actor="system-seeder"
            )
            added_names = ", ".join(s["name"] for s in missing_subs)
            print(f"[SEED] Indicator '{ind['name']}': adicionados subindicadores [{added_names}]")

    # ─── Patients ─────────────────────────────────────────────────
    # Desativado a pedido do usuário para evitar duplicatas em produção.
    # Pacientes devem ser cadastrados manualmente pela interface.

    print("[SEED] Database seeding completed via Event Sourcing.")
