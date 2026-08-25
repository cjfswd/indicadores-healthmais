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

    mongo_uri = os.getenv("MONGO_URI", "memory")
    db_name = os.getenv("DB_NAME", "coringa_db")

    # O banco in-memory é OPT-IN explícito, nunca inferido do sistema operacional.
    # Antes, qualquer execução em Windows caía no mock e nada era persistido —
    # quem testava localmente via o app "salvar" e perdia tudo no restart.
    use_memory = (
        os.getenv("USE_IN_MEMORY_DB", "").strip().lower() in ("1", "true", "yes")
        or mongo_uri.strip().lower() in ("", "memory")
    )

    if use_memory:
        from mongomock_motor import AsyncMongoMockClient
        db_client = AsyncMongoMockClient()
        print(
            "[AVISO] MongoDB IN-MEMORY: os dados somem no restart. "
            "Defina MONGO_URI para persistir de verdade."
        )
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

        # Verifica se já tem operadores mongo ($set, $push, etc)
        has_operator = any(k.startswith("$") for k in update_fields.keys())

        if not has_operator:
            update_fields["updatedAt"] = now

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

    elif event_type == "REACTIVATE":
        updated = await col.find_one_and_update(
            {"_id": ObjectId(stream_id)},
            {"$set": {
                "deletedAt": None,
                "inactive": False,
                "inactivationReason": None,
                "updatedAt": now,
            }},
            return_document=True
        )
        return updated or {}

    return {}


def _resolve_path(state: dict, path: str, create: bool = False):
    """Navega um caminho com pontos ('events.2.file') e devolve (container, chave).

    Suporta índices numéricos em listas. Retorna (None, None) se o caminho não
    existir e create=False.
    """
    parts = path.split(".")
    current: Any = state
    for part in parts[:-1]:
        if isinstance(current, list):
            try:
                idx = int(part)
            except ValueError:
                return None, None
            if idx >= len(current):
                return None, None
            current = current[idx]
        elif isinstance(current, dict):
            if part not in current:
                if not create:
                    return None, None
                current[part] = {}
            current = current[part]
        else:
            return None, None

    last = parts[-1]
    if isinstance(current, list):
        try:
            return current, int(last)
        except ValueError:
            return None, None
    if isinstance(current, dict):
        return current, last
    return None, None


def _matches(doc: Any, criteria: Any) -> bool:
    """Comparação simples usada pelo $pull: igualdade direta ou subset de campos."""
    if isinstance(criteria, dict) and isinstance(doc, dict):
        return all(str(doc.get(k)) == str(v) for k, v in criteria.items())
    return doc == criteria


def apply_operators(state: dict, data: dict) -> dict:
    """Aplica um patch do event store no estado, com ou sem operadores mongo.

    O snapshot é materializado pelo próprio MongoDB; o replay precisa chegar no
    mesmo resultado, então os operadores usados pelo sistema ($set, $push, $pull,
    $unset) são interpretados aqui em vez de descartados.
    """
    has_operator = any(k.startswith("$") for k in data.keys())

    if not has_operator:
        patch = {k: v for k, v in data.items()}
        state.update(patch)
        return state

    for op, payload in data.items():
        if not op.startswith("$") or not isinstance(payload, dict):
            continue

        if op == "$set":
            for path, value in payload.items():
                container, key = _resolve_path(state, path, create=True)
                if container is None:
                    continue
                if isinstance(container, list):
                    while len(container) <= key:
                        container.append({})
                container[key] = copy.deepcopy(value)

        elif op == "$unset":
            for path in payload.keys():
                container, key = _resolve_path(state, path)
                if isinstance(container, dict):
                    container.pop(key, None)

        elif op == "$push":
            for path, value in payload.items():
                container, key = _resolve_path(state, path, create=True)
                if container is None:
                    continue
                alvo = container.get(key) if isinstance(container, dict) else None
                if not isinstance(alvo, list):
                    alvo = []
                    container[key] = alvo
                if isinstance(value, dict) and "$each" in value:
                    alvo.extend(copy.deepcopy(value["$each"]))
                else:
                    alvo.append(copy.deepcopy(value))

        elif op == "$pull":
            for path, criteria in payload.items():
                container, key = _resolve_path(state, path)
                if container is None:
                    continue
                alvo = container.get(key) if isinstance(container, dict) else None
                if isinstance(alvo, list):
                    container[key] = [d for d in alvo if not _matches(d, criteria)]

    return state


async def replay_stream(stream_type: str, stream_id: str) -> dict:
    """Reconstrói o estado a partir do replay completo de eventos."""
    database = get_db()
    events = await database[EVENT_STORE_COLLECTION].find(
        {"streamId": stream_id, "streamType": stream_type}
    ).sort("version", 1).to_list(length=10000)

    state: dict = {}
    for event in events:
        if event["eventType"] == "CREATE":
            state = copy.deepcopy(event["data"])
            state["deletedAt"] = None
        elif event["eventType"] == "UPDATE":
            state = apply_operators(state, event["data"] or {})
        elif event["eventType"] == "SOFT_DELETE":
            state["deletedAt"] = event["timestamp"]
        elif event["eventType"] == "REACTIVATE":
            state["deletedAt"] = None
            state["inactive"] = False
            state["inactivationReason"] = None

    state["_id"] = stream_id
    return state


async def get_stream_events(stream_type: str, stream_id: str) -> list:
    """Retorna todos os eventos de um stream, ordenados por version."""
    database = get_db()
    events = await database[EVENT_STORE_COLLECTION].find(
        {"streamId": stream_id, "streamType": stream_type}
    ).sort("version", 1).to_list(length=10000)
    return events
