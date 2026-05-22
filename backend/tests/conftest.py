"""
Fixtures compartilhadas para todos os testes.
Usa mongomock_motor para simular MongoDB in-memory.
"""
import pytest
import asyncio
from mongomock_motor import AsyncMongoMockClient
from httpx import AsyncClient, ASGITransport

import core.database as db_module
from main import app


@pytest.fixture(scope="session")
def event_loop():
    """Usa um único event loop para toda a sessão de testes."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    """Inicializa banco in-memory antes de cada teste e limpa depois."""
    client = AsyncMongoMockClient()
    database = client["test_db"]

    # Injeta o banco de teste no módulo global
    db_module.db_client = client
    db_module.db = database

    # Cria índices do event store
    await database[db_module.EVENT_STORE_COLLECTION].create_index(
        [("streamId", 1), ("streamType", 1), ("version", 1)],
        unique=True
    )
    await database[db_module.EVENT_STORE_COLLECTION].create_index(
        [("streamType", 1), ("timestamp", -1)]
    )

    yield database

    # Limpa todas as collections após cada teste
    collections = await database.list_collection_names()
    for col_name in collections:
        await database[col_name].drop()

    client.close()


@pytest.fixture
async def client(setup_db):
    """Cliente HTTP assíncrono para testar endpoints FastAPI."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def make_meta(action: str, collection: str, **kwargs) -> str:
    """Helper para montar o header x-db-meta como JSON string."""
    import json
    meta = {"action": action, "collection": collection, **kwargs}
    return json.dumps(meta)


def make_auth_header(email: str = "test@healthmais.com") -> str:
    """Gera um header Authorization válido com JWT contendo o email."""
    import jwt as pyjwt
    token = pyjwt.encode({"id": "test123", "email": email}, "coringa_secret_key", algorithm="HS256")
    return f"Bearer {token}"

