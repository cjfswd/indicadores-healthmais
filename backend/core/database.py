import os
import json
import copy
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from typing import Any, Optional

db_client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None

# ─── Coleções do Event Sourcing ──────────────────────────────────
EVENT_STORE_COLLECTION = "events_store"


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return db


async def init_db():
    global db_client, db
    
    import sys
    mongo_uri = os.getenv("MONGO_URI", "memory")
    db_name = os.getenv("DB_NAME", "coringa_db")

    # Windows = dev local → sempre in-memory
    # Linux   = produção (Docker/Coolify) → MongoDB real
    is_dev = sys.platform == "win32"

    if is_dev:
        from mongomock_motor import AsyncMongoMockClient
        db_client = AsyncMongoMockClient()
        print("[OK] MongoDB IN-MEMORY (dev local / Windows)")
    else:
        db_client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
        print(f"[OK] MongoDB remoto: {mongo_uri[:50]}...")

    db = db_client[db_name]

    # Cria índices para o event store
    await db[EVENT_STORE_COLLECTION].create_index(
        [("streamId", 1), ("streamType", 1), ("version", 1)],
        unique=True
    )
    await db[EVENT_STORE_COLLECTION].create_index(
        [("streamType", 1), ("timestamp", -1)]
    )

    return db


async def close_db():
    global db_client
    if db_client:
        db_client.close()


# ─── Event Sourcing: Core ────────────────────────────────────────

def _snapshot_collection(stream_type: str) -> str:
    """Retorna o nome da collection de snapshots para um tipo de stream."""
    return stream_type  # snapshots vivem na collection original (ex: "patients")


async def _get_next_version(stream_type: str, stream_id: str) -> int:
    """Busca a próxima version para um stream."""
    database = get_db()
    last_event = await database[EVENT_STORE_COLLECTION].find_one(
        {"streamId": stream_id, "streamType": stream_type},
        sort=[("version", -1)]
    )
    return (last_event["version"] + 1) if last_event else 1


async def append_event(
    stream_type: str,
    stream_id: str,
    event_type: str,
    data: Any,
    actor: str = ""
) -> dict:
    """Append-only: insere um evento imutável no event store e re-materializa o snapshot.

    Arquivos ficam como base64 string tanto no event store quanto no snapshot.
    Sem conversão Binary — tudo é string JSON nativo.

    Args:
        stream_type: Collection lógica (ex: "patients", "operators")
        stream_id: ID da entidade (string do ObjectId)
        event_type: "CREATE" | "UPDATE" | "SOFT_DELETE"
        data: Payload do evento (documento completo para CREATE/UPDATE, marker para SOFT_DELETE)
        actor: Email/identificador de quem executou

    Returns:
        O snapshot materializado atualizado
    """
    database = get_db()
    version = await _get_next_version(stream_type, stream_id)

    event = {
        "streamId": stream_id,
        "streamType": stream_type,
        "eventType": event_type,
        "version": version,
        "data": data,
        "timestamp": datetime.now(timezone.utc),
        "actor": actor,
    }

    await database[EVENT_STORE_COLLECTION].insert_one(event)

    # Materializa snapshot sincronamente
    snapshot = await materialize_from_data(stream_type, stream_id, data, event_type)
    return snapshot


async def materialize_from_data(
    stream_type: str,
    stream_id: str,
    data: Any,
    event_type: str
) -> dict:
    """Materializa o snapshot aplicando a operação diretamente."""
    database = get_db()
    col = database[_snapshot_collection(stream_type)]
    now = datetime.now(timezone.utc)

    if event_type == "CREATE":
        # Snapshot inicial = documento completo
        snapshot_state = {**data}
        snapshot_state["_id"] = ObjectId(stream_id)
        snapshot_state["createdAt"] = now
        snapshot_state["updatedAt"] = now
        snapshot_state["deletedAt"] = None

        await col.replace_one(
            {"_id": ObjectId(stream_id)},
            snapshot_state,
            upsert=True
        )
        return snapshot_state

    elif event_type == "UPDATE":
        # Aplica o patch no snapshot existente
        update_fields = {**data}
        for key in ("_id", "createdAt", "deletedAt"):
            update_fields.pop(key, None)
        update_fields["updatedAt"] = now

        # Verifica se já tem operadores mongo ($set, $push, etc)
        has_operator = any(k.startswith("$") for k in update_fields.keys())

        if has_operator:
            if "$set" not in update_fields:
                update_fields["$set"] = {}
            update_fields["$set"]["updatedAt"] = now
            # Remove campos imutáveis de dentro do $set
            for key in ("_id", "createdAt", "deletedAt"):
                update_fields["$set"].pop(key, None)
            update_op = update_fields
        else:
            update_op = {"$set": update_fields}

        updated = await col.find_one_and_update(
            {"_id": ObjectId(stream_id)},
            update_op,
            return_document=True
        )
        return updated or {}

    elif event_type == "SOFT_DELETE":
        updated = await col.find_one_and_update(
            {"_id": ObjectId(stream_id)},
            {"$set": {"deletedAt": now, "updatedAt": now}},
            return_document=True
        )
        return updated or {}

    return {}


async def replay_stream(stream_type: str, stream_id: str) -> dict:
    """Reconstrói o estado a partir do replay completo de eventos."""
    database = get_db()
    events = await database[EVENT_STORE_COLLECTION].find(
        {"streamId": stream_id, "streamType": stream_type}
    ).sort("version", 1).to_list(length=10000)

    state: dict = {}
    for event in events:
        if event["eventType"] == "CREATE":
            state = {**event["data"]}
        elif event["eventType"] == "UPDATE":
            event_data = event["data"]
            # Ignora operadores mongo no replay (aplica como merge simples)
            patch = {k: v for k, v in event_data.items() if not k.startswith("$")}
            state.update(patch)
        elif event["eventType"] == "SOFT_DELETE":
            state["deletedAt"] = event["timestamp"]

    state["_id"] = stream_id
    return state


async def get_stream_events(stream_type: str, stream_id: str) -> list:
    """Retorna todos os eventos de um stream, ordenados por version."""
    database = get_db()
    events = await database[EVENT_STORE_COLLECTION].find(
        {"streamId": stream_id, "streamType": stream_type}
    ).sort("version", 1).to_list(length=10000)
    return events
