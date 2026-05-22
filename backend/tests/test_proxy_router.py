"""
Testes do Proxy Router (routers/proxy.py).

Cobre:
- POST /db/execute — todas as actions: find, findOne, insert, update, delete, aggregate
- Validação de headers (x-db-meta ausente, JSON inválido, campos faltando)
- Soft delete: auto-filtro deletedAt=None no find
- Download de arquivos: GET /db/file/{collection}/{doc_id}/{file_index}
- Histórico de eventos: GET /db/events/{stream_type}/{stream_id}
"""
import json
import base64
import pytest
from bson import ObjectId
from tests.conftest import make_meta, make_auth_header
from core.database import get_db, append_event


# ─── Validação de Headers ─────────────────────────────────────────


class TestHeaderValidation:
    """Testes de validação do header x-db-meta."""

    async def test_missing_meta_header_returns_400(self, client):
        response = await client.post("/db/execute", json={"data": {}})
        assert response.status_code == 400
        assert "Missing x-db-meta" in response.json()["detail"]

    async def test_invalid_json_meta_returns_400(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": "not-valid-json"},
            json={"data": {}},
        )
        assert response.status_code == 400
        assert "Invalid JSON" in response.json()["detail"]

    async def test_missing_action_returns_400(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": json.dumps({"collection": "patients"})},
            json={"data": {}},
        )
        assert response.status_code == 400
        assert "Missing action or collection" in response.json()["detail"]

    async def test_missing_collection_returns_400(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": json.dumps({"action": "find"})},
            json={"data": {}},
        )
        assert response.status_code == 400
        assert "Missing action or collection" in response.json()["detail"]


# ─── INSERT ────────────────────────────────────────────────────────


class TestInsert:
    """Testes para action=insert."""

    async def test_insert_creates_document(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Novo Paciente", "birthDate": ""}},
        )
        body = response.json()

        assert response.status_code == 200
        assert body["success"] is True
        assert body["result"]["name"] == "Novo Paciente"
        assert body["result"]["_id"] is not None

    async def test_insert_sets_timestamps(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Timestamps"}},
        )
        result = response.json()["result"]

        assert result["createdAt"] is not None
        assert result["updatedAt"] is not None
        assert result["deletedAt"] is None

    async def test_insert_creates_event_in_store(self, client, setup_db):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "EventCheck"}},
        )
        doc_id = response.json()["result"]["_id"]

        db = get_db()
        event = await db.events_store.find_one({"streamId": doc_id})
        assert event is not None
        assert event["eventType"] == "CREATE"
        assert event["version"] == 1

    async def test_insert_with_nested_operator(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {
                "name": "Com Operadora",
                "operator": {"_id": "abc123", "name": "Unimed"},
            }},
        )
        result = response.json()["result"]
        assert result["operator"]["name"] == "Unimed"


# ─── FIND ──────────────────────────────────────────────────────────


class TestFind:
    """Testes para action=find."""

    async def test_find_returns_inserted_documents(self, client):
        # Insert 2 documents
        for name in ["Alice", "Bob"]:
            await client.post(
                "/db/execute",
                headers={"x-db-meta": make_meta("insert", "patients")},
                json={"data": {"name": name}},
            )

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("find", "patients")},
            json={"data": {}},
        )
        body = response.json()

        assert body["success"] is True
        assert body["total"] == 2
        assert len(body["result"]) == 2

    async def test_find_excludes_soft_deleted(self, client, setup_db):
        # Insert then soft-delete
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "ToDelete"}},
        )
        doc_id = res.json()["result"]["_id"]

        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("delete", "patients", id=doc_id)},
            json={"data": {}},
        )

        # Insert another that stays active
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Active"}},
        )

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("find", "patients")},
            json={"data": {}},
        )
        body = response.json()

        assert body["total"] == 1
        assert body["result"][0]["name"] == "Active"

    async def test_find_with_query_filter(self, client):
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Filtered", "operator": {"_id": "op1", "name": "Camperj"}}},
        )
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Other", "operator": {"_id": "op2", "name": "Unimed"}}},
        )

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta(
                "find", "patients",
                query={"operator.name": "Camperj"}
            )},
            json={"data": {}},
        )
        body = response.json()

        assert body["total"] == 1
        assert body["result"][0]["name"] == "Filtered"

    async def test_find_with_pagination(self, client):
        for i in range(5):
            await client.post(
                "/db/execute",
                headers={"x-db-meta": make_meta("insert", "patients")},
                json={"data": {"name": f"Patient-{i}"}},
            )

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("find", "patients", skip=2, limit=2)},
            json={"data": {}},
        )
        body = response.json()

        assert body["total"] == 5
        assert len(body["result"]) == 2

    async def test_find_returns_duration(self, client):
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("find", "patients")},
            json={"data": {}},
        )
        assert "duration" in response.json()


# ─── FIND ONE ──────────────────────────────────────────────────────


class TestFindOne:
    """Testes para action=findOne."""

    async def test_find_one_by_id(self, client):
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "FindMe"}},
        )
        doc_id = res.json()["result"]["_id"]

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("findOne", "patients", id=doc_id)},
            json={"data": {}},
        )
        body = response.json()

        assert body["success"] is True
        assert body["result"]["name"] == "FindMe"

    async def test_find_one_nonexistent_returns_null(self, client):
        fake_id = str(ObjectId())
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("findOne", "patients", id=fake_id)},
            json={"data": {}},
        )
        assert response.json()["result"] is None


# ─── UPDATE ────────────────────────────────────────────────────────


class TestUpdate:
    """Testes para action=update."""

    async def test_update_modifies_document(self, client):
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Before"}},
        )
        doc_id = res.json()["result"]["_id"]

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=doc_id)},
            json={"data": {"name": "After"}},
        )
        result = response.json()["result"]

        assert result["name"] == "After"

    async def test_update_creates_event_in_store(self, client, setup_db):
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Original"}},
        )
        doc_id = res.json()["result"]["_id"]

        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=doc_id)},
            json={"data": {"name": "Modified"}},
        )

        db = get_db()
        events = await db.events_store.find(
            {"streamId": doc_id}
        ).sort("version", 1).to_list(100)

        assert len(events) == 2
        assert events[0]["eventType"] == "CREATE"
        assert events[1]["eventType"] == "UPDATE"

    async def test_update_preserves_existing_file_data(self, client, setup_db):
        """Ao atualizar, se o novo payload do file não contém 'data',
        o backend deve preservar o base64 existente no snapshot."""
        doc_id = str(ObjectId())
        db = get_db()

        # Cria documento com file contendo data base64
        await append_event("patients", doc_id, "CREATE", {
            "name": "WithFile",
            "file": {"name": "doc.pdf", "type": "application/pdf", "size": 100, "data": "AAAA=="},
        })

        # Atualiza enviando file sem 'data' (como o frontend faz)
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=doc_id)},
            json={"data": {
                "name": "WithFile Updated",
                "file": {"name": "doc.pdf", "type": "application/pdf", "size": 100},
            }},
        )
        result = response.json()["result"]

        assert result["file"]["data"] == "AAAA=="


# ─── DELETE ────────────────────────────────────────────────────────


class TestDelete:
    """Testes para action=delete (soft delete)."""

    async def test_delete_sets_deletedAt(self, client, setup_db):
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "ToDelete"}},
        )
        doc_id = res.json()["result"]["_id"]

        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("delete", "patients", id=doc_id)},
            json={"data": {}},
        )
        result = response.json()["result"]

        assert result["deletedAt"] is not None

    async def test_delete_already_deleted_returns_null(self, client):
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "DeleteTwice"}},
        )
        doc_id = res.json()["result"]["_id"]

        # First delete
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("delete", "patients", id=doc_id)},
            json={"data": {}},
        )

        # Second delete
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("delete", "patients", id=doc_id)},
            json={"data": {}},
        )
        assert response.json()["result"] is None

    async def test_delete_creates_soft_delete_event(self, client, setup_db):
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "EventDelete"}},
        )
        doc_id = res.json()["result"]["_id"]

        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("delete", "patients", id=doc_id)},
            json={"data": {}},
        )

        db = get_db()
        events = await db.events_store.find(
            {"streamId": doc_id}
        ).sort("version", -1).to_list(1)

        assert events[0]["eventType"] == "SOFT_DELETE"


# ─── FILE DOWNLOAD ─────────────────────────────────────────────────


class TestFileDownload:
    """Testes para GET /db/file/{collection}/{doc_id}/{file_index}."""

    async def test_download_file_from_document(self, client, setup_db):
        doc_id = str(ObjectId())
        file_content = base64.b64encode(b"Hello PDF").decode()

        await append_event("patients", doc_id, "CREATE", {
            "name": "WithFile",
            "file": {"name": "test.pdf", "type": "application/pdf", "size": 9, "data": file_content},
        })

        response = await client.get(f"/db/file/patients/{doc_id}/0")

        assert response.status_code == 200
        assert response.content == b"Hello PDF"
        assert "test.pdf" in response.headers.get("content-disposition", "")

    async def test_download_file_not_found(self, client, setup_db):
        doc_id = str(ObjectId())
        await append_event("patients", doc_id, "CREATE", {"name": "NoFile"})

        response = await client.get(f"/db/file/patients/{doc_id}/0")
        assert response.status_code == 404

    async def test_download_document_not_found(self, client):
        fake_id = str(ObjectId())
        response = await client.get(f"/db/file/patients/{fake_id}/0")
        assert response.status_code == 404

    async def test_download_file_from_event(self, client, setup_db):
        doc_id = str(ObjectId())
        event_id = "evt123"
        file_content = base64.b64encode(b"Event file").decode()

        await append_event("patients", doc_id, "CREATE", {
            "name": "WithEventFile",
            "events": [{
                "_id": event_id,
                "file": {"name": "evt.pdf", "type": "application/pdf", "size": 10, "data": file_content},
            }],
        })

        response = await client.get(f"/db/file/patients/{doc_id}/0?event_id={event_id}")

        assert response.status_code == 200
        assert response.content == b"Event file"


# ─── EVENT HISTORY ENDPOINT ────────────────────────────────────────


class TestEventHistory:
    """Testes para GET /db/events/{stream_type}/{stream_id}."""

    async def test_get_entity_events(self, client, setup_db):
        doc_id = str(ObjectId())
        await append_event("patients", doc_id, "CREATE", {"name": "History"})
        await append_event("patients", doc_id, "UPDATE", {"name": "Updated"})

        response = await client.get(f"/db/events/patients/{doc_id}")
        body = response.json()

        assert body["success"] is True
        assert body["total"] == 2
        assert len(body["result"]) == 2

    async def test_get_events_for_unknown_entity(self, client):
        fake_id = str(ObjectId())
        response = await client.get(f"/db/events/patients/{fake_id}")
        body = response.json()

        assert body["success"] is True
        assert body["total"] == 0


# ─── AGGREGATE ─────────────────────────────────────────────────────


class TestAggregate:
    """Testes para action=aggregate."""

    async def test_aggregate_with_match(self, client, setup_db):
        for name in ["Agg-A", "Agg-B", "Agg-C"]:
            await client.post(
                "/db/execute",
                headers={"x-db-meta": make_meta("insert", "patients")},
                json={"data": {"name": name, "operator": {"_id": "opx", "name": "TestOp"}}},
            )

        pipeline = [
            {"$match": {"operator.name": "TestOp"}},
            {"$count": "total"},
        ]
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("aggregate", "patients", pipeline=pipeline)},
            json={"data": {}},
        )
        body = response.json()

        assert body["success"] is True
        assert body["result"][0]["total"] == 3


# ─── ACTOR EXTRACTION ─────────────────────────────────────────────


class TestActorExtraction:
    """Testes para extração do actor via JWT e fallbacks."""

    async def test_actor_from_jwt(self, client, setup_db):
        """Actor extraído do JWT quando Authorization header presente."""
        response = await client.post(
            "/db/execute",
            headers={
                "x-db-meta": make_meta("insert", "patients"),
                "authorization": make_auth_header("admin@healthmais.com"),
            },
            json={"data": {"name": "JWT Actor Test"}},
        )
        doc_id = response.json()["result"]["_id"]

        db = get_db()
        event = await db.events_store.find_one({"streamId": doc_id})
        assert event["actor"] == "admin@healthmais.com"

    async def test_actor_fallback_to_updatedBy(self, client, setup_db):
        """Actor extraído do campo updatedBy quando JWT ausente."""
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Fallback Actor Test", "updatedBy": "user@frontend.com"}},
        )
        doc_id = response.json()["result"]["_id"]

        db = get_db()
        event = await db.events_store.find_one({"streamId": doc_id})
        assert event["actor"] == "user@frontend.com"

    async def test_actor_fallback_to_metadata(self, client, setup_db):
        """Actor extraído do metadata quando JWT e updatedBy ausentes."""
        response = await client.post(
            "/db/execute",
            headers={
                "x-db-meta": make_meta("insert", "patients", actor="meta@test.com"),
            },
            json={"data": {"name": "Meta Actor Test"}},
        )
        doc_id = response.json()["result"]["_id"]

        db = get_db()
        event = await db.events_store.find_one({"streamId": doc_id})
        assert event["actor"] == "meta@test.com"

    async def test_actor_empty_when_no_auth(self, client, setup_db):
        """Actor vazio quando nenhum método de identificação presente."""
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "No Actor Test"}},
        )
        doc_id = response.json()["result"]["_id"]

        db = get_db()
        event = await db.events_store.find_one({"streamId": doc_id})
        assert event["actor"] == ""

    async def test_jwt_takes_priority_over_updatedBy(self, client, setup_db):
        """JWT tem prioridade sobre updatedBy do frontend."""
        response = await client.post(
            "/db/execute",
            headers={
                "x-db-meta": make_meta("insert", "patients"),
                "authorization": make_auth_header("jwt@priority.com"),
            },
            json={"data": {"name": "Priority Test", "updatedBy": "frontend@fallback.com"}},
        )
        doc_id = response.json()["result"]["_id"]

        db = get_db()
        event = await db.events_store.find_one({"streamId": doc_id})
        assert event["actor"] == "jwt@priority.com"

    async def test_actor_on_update(self, client, setup_db):
        """Actor registrado corretamente em eventos UPDATE."""
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Update Actor"}},
        )
        doc_id = res.json()["result"]["_id"]

        await client.post(
            "/db/execute",
            headers={
                "x-db-meta": make_meta("update", "patients", id=doc_id),
                "authorization": make_auth_header("updater@test.com"),
            },
            json={"data": {"name": "Updated"}},
        )

        db = get_db()
        events = await db.events_store.find(
            {"streamId": doc_id}
        ).sort("version", 1).to_list(100)

        assert events[1]["actor"] == "updater@test.com"

    async def test_actor_on_delete(self, client, setup_db):
        """Actor registrado corretamente em eventos SOFT_DELETE."""
        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Delete Actor"}},
        )
        doc_id = res.json()["result"]["_id"]

        await client.post(
            "/db/execute",
            headers={
                "x-db-meta": make_meta("delete", "patients", id=doc_id),
                "authorization": make_auth_header("deleter@test.com"),
            },
            json={"data": {}},
        )

        db = get_db()
        events = await db.events_store.find(
            {"streamId": doc_id}
        ).sort("version", -1).to_list(1)

        assert events[0]["actor"] == "deleter@test.com"

    async def test_updatedBy_removed_from_data(self, client, setup_db):
        """O campo updatedBy é removido do data antes de salvar no snapshot."""
        response = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "Clean Data", "updatedBy": "should@vanish.com"}},
        )
        result = response.json()["result"]
        assert "updatedBy" not in result


# ─── DUPLICATE PREVENTION ─────────────────────────────────────────


class TestDuplicatePrevention:
    """Testes para prevenção de duplicatas em patients e operators."""

    async def test_duplicate_patient_same_operator_returns_409(self, client):
        """Inserir paciente com mesmo nome+operadora retorna 409."""
        patient_data = {
            "name": "Maria Silva",
            "operator": {"_id": "op1", "name": "Unimed"},
        }

        # Primeira inserção: sucesso
        res1 = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": patient_data},
        )
        assert res1.status_code == 200

        # Segunda inserção: conflito
        res2 = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": patient_data},
        )
        assert res2.status_code == 409
        assert "já existe" in res2.json()["detail"].lower()

    async def test_same_name_different_operator_allowed(self, client):
        """Pacientes com mesmo nome mas operadoras diferentes são permitidos."""
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "João Pereira", "operator": {"_id": "op1", "name": "Camperj"}}},
        )

        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": {"name": "João Pereira", "operator": {"_id": "op2", "name": "Unimed"}}},
        )
        assert res.status_code == 200

    async def test_can_recreate_after_soft_delete(self, client):
        """Após soft-delete, pode criar paciente com mesmo nome."""
        patient_data = {
            "name": "Deletado e Recriado",
            "operator": {"_id": "op1", "name": "Unimed"},
        }

        # Cria e deleta
        res1 = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": patient_data},
        )
        doc_id = res1.json()["result"]["_id"]

        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("delete", "patients", id=doc_id)},
            json={"data": {}},
        )

        # Recria: deve funcionar
        res2 = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "patients")},
            json={"data": patient_data},
        )
        assert res2.status_code == 200

    async def test_duplicate_operator_returns_409(self, client):
        """Inserir operadora com mesmo nome retorna 409."""
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "operators")},
            json={"data": {"name": "Camperj"}},
        )

        res = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("insert", "operators")},
            json={"data": {"name": "Camperj"}},
        )
        assert res.status_code == 409

    async def test_non_protected_collection_allows_duplicates(self, client):
        """Collections fora de patients/operators não têm proteção."""
        for _ in range(2):
            res = await client.post(
                "/db/execute",
                headers={"x-db-meta": make_meta("insert", "notifications")},
                json={"data": {"title": "Duplicada", "message": "Teste"}},
            )
            assert res.status_code == 200

