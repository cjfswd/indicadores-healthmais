"""
Testes das operações pontuais sobre o array de eventos do paciente.

Cobre:
- eventAppend / eventUpdate / eventRemove sem read-modify-write do array inteiro
- Gravações concorrentes: nenhum evento é perdido
- Alta e óbito marcam o paciente como inativo, sem escondê-lo do sistema
- Reativação
- Paridade entre replay do event store e snapshot materializado
"""
import json
import asyncio
import pytest
from tests.conftest import make_meta, make_auth_header
from core.database import get_db, replay_stream


async def _criar_paciente(client, nome="Paciente Teste"):
    resposta = await client.post(
        "/db/execute",
        headers={"x-db-meta": make_meta("insert", "patients")},
        json={"data": {"name": nome, "events": []}},
    )
    return resposta.json()["result"]["_id"]


def _evento(evt_id: str, indicador="02 - Visitas", sub="2.1 - Visita médica"):
    return {
        "_id": evt_id,
        "occurrenceDate": "2026-05-10",
        "indicator": {"name": indicador},
        "subindicator": {"name": sub},
        "observations": "",
    }


async def _append(client, patient_id, evento):
    return await client.post(
        "/db/execute",
        headers={
            "x-db-meta": make_meta("update", "patients", id=patient_id),
            "authorization": make_auth_header(),
        },
        json={"data": {"__op": "eventAppend", "event": evento}},
    )


class TestEventAppend:
    async def test_append_adiciona_sem_reenviar_array(self, client, setup_db):
        patient_id = await _criar_paciente(client)
        resposta = await _append(client, patient_id, _evento("a" * 24))

        assert resposta.status_code == 200
        eventos = resposta.json()["result"]["events"]
        assert len(eventos) == 1
        assert eventos[0]["_id"] == "a" * 24

    async def test_appends_concorrentes_nao_perdem_evento(self, client, setup_db):
        """O bug original: dois saves seguidos, o segundo apagava o primeiro."""
        patient_id = await _criar_paciente(client)

        await asyncio.gather(
            _append(client, patient_id, _evento("a" * 24)),
            _append(client, patient_id, _evento("b" * 24)),
            _append(client, patient_id, _evento("c" * 24)),
        )

        doc = await get_db()["patients"].find_one({"name": "Paciente Teste"})
        ids = {e["_id"] for e in doc["events"]}
        assert ids == {"a" * 24, "b" * 24, "c" * 24}

    async def test_append_duplicado_retorna_409(self, client, setup_db):
        patient_id = await _criar_paciente(client)
        await _append(client, patient_id, _evento("a" * 24))
        resposta = await _append(client, patient_id, _evento("a" * 24))
        assert resposta.status_code == 409


class TestEventUpdateRemove:
    async def test_update_altera_apenas_o_evento_alvo(self, client, setup_db):
        patient_id = await _criar_paciente(client)
        await _append(client, patient_id, _evento("a" * 24))
        await _append(client, patient_id, _evento("b" * 24))

        resposta = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=patient_id)},
            json={"data": {
                "__op": "eventUpdate",
                "eventId": "b" * 24,
                "event": {"_id": "b" * 24, "observations": "corrigido"},
            }},
        )

        eventos = {e["_id"]: e for e in resposta.json()["result"]["events"]}
        assert eventos["b" * 24]["observations"] == "corrigido"
        assert eventos["a" * 24]["observations"] == ""
        assert eventos["b" * 24]["occurrenceDate"] == "2026-05-10"  # campo preservado

    async def test_update_de_evento_inexistente_retorna_404(self, client, setup_db):
        patient_id = await _criar_paciente(client)
        resposta = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=patient_id)},
            json={"data": {"__op": "eventUpdate", "eventId": "z" * 24, "event": {}}},
        )
        assert resposta.status_code == 404

    async def test_remove_apaga_somente_o_evento(self, client, setup_db):
        patient_id = await _criar_paciente(client)
        await _append(client, patient_id, _evento("a" * 24))
        await _append(client, patient_id, _evento("b" * 24))

        resposta = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=patient_id)},
            json={"data": {"__op": "eventRemove", "eventId": "a" * 24}},
        )

        ids = [e["_id"] for e in resposta.json()["result"]["events"]]
        assert ids == ["b" * 24]


class TestInativacao:
    async def test_obito_marca_inativo_sem_esconder(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Óbito")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="04 - Óbito", sub="4.1 - Óbito domiciliar"))

        doc = await get_db()["patients"].find_one({"name": "Paciente Óbito"})
        assert doc["inactive"] is True
        assert doc["inactivationReason"] == "obito"
        assert doc["deletedAt"] is None  # continua visível no find padrão

    async def test_alta_marca_inativo(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Alta")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="01 - Saídas", sub="1.1 - Alta domiciliar"))

        doc = await get_db()["patients"].find_one({"name": "Paciente Alta"})
        assert doc["inactive"] is True
        assert doc["inactivationReason"] == "alta"

    async def test_paciente_inativo_continua_no_find(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Alta")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="04 - Óbito", sub="4.1 - Óbito"))

        resposta = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("find", "patients")},
            json={"data": {}},
        )
        nomes = [p["name"] for p in resposta.json()["result"]]
        assert "Paciente Alta" in nomes

    async def test_eventos_do_inativo_continuam_acessiveis(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Alta")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="04 - Óbito", sub="4.1 - Óbito"))

        resposta = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("findOne", "patients", id=patient_id)},
            json={"data": {}},
        )
        assert len(resposta.json()["result"]["events"]) == 1

    async def test_listagem_de_inativos(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Óbito")
        await _criar_paciente(client, "Paciente Ativo")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="04 - Óbito", sub="4.1 - Óbito"))

        resposta = await client.get("/db/patients/inactive")
        result = resposta.json()["result"]
        assert [p["name"] for p in result] == ["Paciente Óbito"]
        assert result[0]["inactivationReason"] == "obito"

    async def test_reativacao_limpa_marcadores(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Óbito")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="04 - Óbito", sub="4.1 - Óbito"))

        resposta = await client.post(f"/db/patients/{patient_id}/reactivate")
        assert resposta.status_code == 200

        doc = await get_db()["patients"].find_one({"name": "Paciente Óbito"})
        assert doc["inactive"] is False
        assert doc["deletedAt"] is None
        assert len(doc["events"]) == 1  # histórico intacto


class TestParidadeReplaySnapshot:
    """O replay precisa chegar no mesmo estado que o snapshot materializado."""

    async def test_replay_reproduz_snapshot_com_operadores(self, client, setup_db):
        patient_id = await _criar_paciente(client)
        await _append(client, patient_id, _evento("a" * 24))
        await _append(client, patient_id, _evento("b" * 24))
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=patient_id)},
            json={"data": {
                "__op": "eventUpdate",
                "eventId": "a" * 24,
                "event": {"_id": "a" * 24, "observations": "ajustado"},
            }},
        )
        await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=patient_id)},
            json={"data": {"__op": "eventRemove", "eventId": "b" * 24}},
        )

        snapshot = await get_db()["patients"].find_one({"name": "Paciente Teste"})
        replay = await replay_stream("patients", patient_id)

        assert [e["_id"] for e in replay["events"]] == [e["_id"] for e in snapshot["events"]]
        assert replay["events"][0]["observations"] == snapshot["events"][0]["observations"]

    async def test_replay_reflete_inativacao(self, client, setup_db):
        patient_id = await _criar_paciente(client, "Paciente Óbito")
        await _append(client, patient_id, _evento(
            "a" * 24, indicador="04 - Óbito", sub="4.1 - Óbito"))

        replay = await replay_stream("patients", patient_id)
        assert replay["inactive"] is True
        assert replay["deletedAt"] is None
