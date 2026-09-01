"""Testes de GET /painel/dados -- a leitura que a tela da raiz desenha.

O ponto destes testes nao e o formato do JSON: e que o painel mostre o que a
equipe acabou de gravar. A gravacao acontece em POST /db/execute (Mongo, event
store), e a leitura acontece aqui. Cada teste faz o caminho inteiro -- grava,
altera, exclui, e pergunta ao painel o que ele ve.

Cobre:
- sessao obrigatoria (a resposta carrega nome de paciente e observacao clinica)
- gravacao: paciente novo aparece na leitura, ja com a operadora resolvida
- soft update: alteracao aparece, e a trilha guarda as duas versoes
- SOFT_DELETE: some das listas ativas, continua visivel como excluido, e o
  registro nunca sai da trilha
- eventos do paciente viram linhas de evento, com anexo e observacao
"""
import json
import pytest
from tests.conftest import make_meta, make_auth_header

SESSAO = {"Authorization": make_auth_header("enfermagem@healthmaiscuidados.com")}


async def _executar(client, action, collection, data=None, **meta):
    resposta = await client.post(
        "/db/execute",
        headers={"x-db-meta": make_meta(action, collection, **meta),
                 "content-type": "application/json",
                 **SESSAO},
        json={"data": data or {}},
    )
    assert resposta.status_code == 200, resposta.text
    corpo = resposta.json()
    assert corpo["success"] is True
    return corpo["result"]


async def _painel(client):
    resposta = await client.get("/painel/dados", headers=SESSAO)
    assert resposta.status_code == 200, resposta.text
    return resposta.json()


async def _operadora(client, nome="Unimed"):
    return await _executar(client, "insert", "operators", {"name": nome})


async def _paciente(client, nome, operadora, **extra):
    return await _executar(client, "insert", "patients", {
        "name": nome,
        "operator": {"_id": operadora["_id"], "name": operadora["name"]},
        "admissionDate": "2026-08-01",
        "observations": "  observacao   com  espaco  ",
        **extra,
    })


class TestSessao:
    async def test_sem_sessao_recusa(self, client):
        resposta = await client.get("/painel/dados")
        assert resposta.status_code == 401

    async def test_token_invalido_recusa(self, client):
        resposta = await client.get("/painel/dados",
                                    headers={"Authorization": "Bearer nao-e-um-token"})
        assert resposta.status_code == 401


class TestGravacao:
    async def test_paciente_gravado_aparece_no_painel(self, client):
        op = await _operadora(client)
        await _paciente(client, "MARIA DE TESTE", op)

        dados = await _painel(client)
        nomes = [p["nome"] for p in dados["pacientes"]]
        assert "MARIA DE TESTE" in nomes

    async def test_paciente_gravado_carrega_operadora_e_situacao(self, client):
        op = await _operadora(client, "Camperj")
        await _paciente(client, "JOAO DE TESTE", op)

        dados = await _painel(client)
        p = next(x for x in dados["pacientes"] if x["nome"] == "JOAO DE TESTE")
        assert p["operadora"] == "Camperj"
        assert p["situacao"] == "ativo"
        assert p["admissao"] == "2026-08-01"
        # Mesma normalizacao do SQL: espaco colapsado e aparado.
        assert p["observacoes"] == "observacao com espaco"

    async def test_operadora_gravada_conta_os_pacientes(self, client):
        op = await _operadora(client)
        await _paciente(client, "PACIENTE UM", op)
        await _paciente(client, "PACIENTE DOIS", op)

        dados = await _painel(client)
        linha = next(o for o in dados["operadoras"] if o["nome"] == "Unimed")
        assert linha["pacientes"] == 2

    async def test_gravacao_deixa_rastro_na_trilha(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "COM TRILHA", op)

        dados = await _painel(client)
        criacao = [a for a in dados["auditoria"]
                   if a["stream_id"] == str(p["_id"]) and a["tipo"] == "CREATE"]
        assert len(criacao) == 1
        assert criacao[0]["versao"] == 1
        assert criacao[0]["ator"] == "enfermagem@healthmaiscuidados.com"


class TestSoftUpdate:
    async def test_alteracao_aparece_na_leitura(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "ANTES", op)

        await _executar(client, "update", "patients", {"name": "DEPOIS"}, id=str(p["_id"]))

        dados = await _painel(client)
        nomes = [x["nome"] for x in dados["pacientes"]]
        assert "DEPOIS" in nomes
        assert "ANTES" not in nomes

    async def test_alteracao_nao_apaga_a_versao_anterior(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "ANTES", op)
        await _executar(client, "update", "patients", {"name": "DEPOIS"}, id=str(p["_id"]))

        dados = await _painel(client)
        trilha = sorted((a for a in dados["auditoria"] if a["stream_id"] == str(p["_id"])),
                        key=lambda a: a["versao"])
        assert [a["tipo"] for a in trilha] == ["CREATE", "UPDATE"]
        assert [a["versao"] for a in trilha] == [1, 2]
        # A trilha diz qual campo mudou, nao so que mudou algo.
        assert "name" in trilha[1]["campos"]

    async def test_campo_nao_tocado_permanece(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "ESTAVEL", op)
        await _executar(client, "update", "patients",
                        {"observations": "outra coisa"}, id=str(p["_id"]))

        dados = await _painel(client)
        linha = next(x for x in dados["pacientes"] if x["nome"] == "ESTAVEL")
        assert linha["admissao"] == "2026-08-01"
        assert linha["observacoes"] == "outra coisa"


class TestSoftDelete:
    async def test_excluido_sai_da_situacao_ativo(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "SAIU", op)

        await _executar(client, "delete", "patients", id=str(p["_id"]))

        dados = await _painel(client)
        linha = next(x for x in dados["pacientes"] if x["nome"] == "SAIU")
        assert linha["situacao"] == "excluido"
        assert linha["excluido"]

    async def test_excluido_continua_visivel_para_auditoria(self, client):
        """Exclusao logica: o paciente sai do denominador, nao da base.

        A pagina de inativos existe para mostrar quem a regra antiga escondia --
        se a leitura filtrasse `deletedAt`, ela ficaria vazia por construcao.
        """
        op = await _operadora(client)
        p = await _paciente(client, "ESCONDIDO", op)
        await _executar(client, "delete", "patients", id=str(p["_id"]))

        dados = await _painel(client)
        assert any(x["nome"] == "ESCONDIDO" for x in dados["pacientes"])

    async def test_exclusao_fica_registrada_na_trilha(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "COM REGISTRO", op)
        await _executar(client, "delete", "patients", id=str(p["_id"]))

        dados = await _painel(client)
        tipos = [a["tipo"] for a in dados["auditoria"] if a["stream_id"] == str(p["_id"])]
        assert "SOFT_DELETE" in tipos

    async def test_operadora_excluida_some_do_cadastro(self, client):
        op = await _operadora(client)
        await _executar(client, "delete", "operators", id=str(op["_id"]))

        dados = await _painel(client)
        assert [o["nome"] for o in dados["operadoras"]] == []


class TestEventos:
    async def test_evento_do_paciente_vira_linha_de_evento(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "COM EVENTO", op, events=[{
            "_id": "evento-1",
            "occurrenceDate": "2026-08-15",
            "indicator": {"name": "02 - Nº de Intercorrências"},
            "subindicator": {"name": "2.1 - Resolvidas em domicílio"},
            "observations": "  resolvida   pela equipe  ",
            "file": None,
        }])

        dados = await _painel(client)
        ev = next(e for e in dados["eventos"] if e["paciente_id"] == str(p["_id"]))
        assert ev["data"] == "2026-08-15"
        assert ev["card"] == "02"
        assert ev["subindicador"] == "2.1 - Resolvidas em domicílio"
        assert ev["operadora"] == "Unimed"
        assert ev["observacoes"] == "resolvida pela equipe"
        assert ev["anexo"] is False

    async def test_anexo_do_evento_e_sinalizado(self, client):
        op = await _operadora(client)
        await _paciente(client, "COM ANEXO", op, events=[{
            "_id": "evento-2",
            "occurrenceDate": "2026-08-16",
            "indicator": {"name": "09 - Nº de ouvidorias"},
            "subindicator": {"name": "9.1 - Elogios"},
            "file": {"name": "carta.pdf", "data": "AAAA"},
        }])

        dados = await _painel(client)
        ev = next(e for e in dados["eventos"] if e["id"] == "evento-2")
        assert ev["anexo"] is True

    async def test_pivo_de_relatorios_sai_dos_eventos(self, client):
        op = await _operadora(client)
        await _paciente(client, "PIVO", op, events=[{
            "_id": "evento-3",
            "occurrenceDate": "2026-07-10",
            "indicator": {"name": "05 - Taxa de Alterações de PAD"},
            "subindicator": {"name": "5.2 - ↓ PAD"},
        }])

        dados = await _painel(client)
        assert dados["relatorios"]["meses"] == ["2026-07"]
        linha = next(l for l in dados["relatorios"]["linhas"]
                     if l["nome"] == "05 - Taxa de Alterações de PAD")
        assert linha["total"] == 1
        assert linha["meses"]["2026-07"] == 1


class TestUsuarios:
    async def test_conta_os_registros_pelo_ator_da_trilha(self, client):
        db_op = await _operadora(client)
        await _paciente(client, "GRAVADO POR ALGUEM", db_op)
        await _executar(client, "insert", "users", {
            "name": "Enfermagem", "email": "enfermagem@healthmaiscuidados.com"})

        dados = await _painel(client)
        u = next(x for x in dados["usuarios"]
                 if x["email"] == "enfermagem@healthmaiscuidados.com")
        assert u["dominio"] == "healthmaiscuidados.com"
        # Duas gravacoes com esta sessao: a operadora e o paciente.
        assert u["registros"] >= 2


class TestRegistroNovo:
    """O registro que o painel grava no dia a dia: um evento no paciente.

    Ele nasce ja no catalogo da recategorizacao -- quem registrou escolheu a
    categoria na hora. A leitura tem que devolver essa marca, senao a tela
    trataria todo registro novo como caso a decidir na triagem.
    """

    async def test_registro_aparece_com_o_catalogo_novo(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "REGISTRA AQUI", op)

        await _executar(client, "update", "patients", {
            "__op": "eventAppend",
            "event": {
                "_id": "reg-1",
                "occurrenceDate": "2026-08-20",
                "indicator": {"name": "02 - Intercorrências e Resolutividade"},
                "subindicator": {"name": "2.4 - Remoção com internação hospitalar"},
                "observations": "removida para o hospital",
                "catalogo": "recategorizacao-2026",
                "card": "02",
                "cod": "2.4",
                "responsavel": "Enfermagem Healthmais",
            },
        }, id=str(p["_id"]))

        dados = await _painel(client)
        ev = next(e for e in dados["eventos"] if e["id"] == "reg-1")
        assert ev["catalogo"] == "recategorizacao-2026"
        assert ev["card"] == "02"
        assert ev["cod"] == "2.4"
        assert ev["responsavel"] == "Enfermagem Healthmais"
        assert ev["paciente"] == "REGISTRA AQUI"

    async def test_registro_entra_na_trilha_como_alteracao(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "COM TRILHA DE EVENTO", op)
        await _executar(client, "update", "patients", {
            "__op": "eventAppend",
            "event": {"_id": "reg-2", "occurrenceDate": "2026-08-21",
                      "indicator": {"name": "09 - Ouvidoria"},
                      "subindicator": {"name": "9.4 - Elogio"},
                      "catalogo": "recategorizacao-2026", "card": "09", "cod": "9.4"},
        }, id=str(p["_id"]))

        dados = await _painel(client)
        trilha = [a for a in dados["auditoria"] if a["stream_id"] == str(p["_id"])]
        alteracoes = [a for a in trilha if a["tipo"] == "UPDATE"]
        assert len(alteracoes) == 1
        # `$push` e operador do documento, nao campo: a tela os separa.
        assert "$push" in alteracoes[0]["operadores"]
        assert alteracoes[0]["campos"] == []

    async def test_registro_duplicado_e_recusado(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "SEM DUPLICATA", op)
        evento = {"_id": "reg-3", "occurrenceDate": "2026-08-22",
                  "indicator": {"name": "09 - Ouvidoria"},
                  "subindicator": {"name": "9.4 - Elogio"},
                  "catalogo": "recategorizacao-2026", "card": "09", "cod": "9.4"}
        await _executar(client, "update", "patients",
                        {"__op": "eventAppend", "event": evento}, id=str(p["_id"]))

        repetido = await client.post(
            "/db/execute",
            headers={"x-db-meta": make_meta("update", "patients", id=str(p["_id"])),
                     "content-type": "application/json", **SESSAO},
            json={"data": {"__op": "eventAppend", "event": evento}},
        )
        assert repetido.status_code == 409


class TestEmpresa:
    """O painel tem seletor de empresa, e o registro precisa ficar onde nasceu.

    Sem `empresa` no documento, o paciente cadastrado com a Cordiva na tela
    reaparecia na HealthMais -- sumia da tela em que acabou de ser criado.
    """

    async def test_paciente_sem_empresa_e_da_healthmais(self, client):
        op = await _operadora(client)
        await _paciente(client, "SEM EMPRESA", op)

        dados = await _painel(client)
        p = next(x for x in dados["pacientes"] if x["nome"] == "SEM EMPRESA")
        assert p["empresa"] == "healthmais"

    async def test_paciente_da_cordiva_fica_na_cordiva(self, client):
        op = await _operadora(client)
        await _paciente(client, "DA CORDIVA", op, empresa="cordiva")

        dados = await _painel(client)
        p = next(x for x in dados["pacientes"] if x["nome"] == "DA CORDIVA")
        assert p["empresa"] == "cordiva"

    async def test_registro_herda_a_empresa_do_paciente(self, client):
        op = await _operadora(client)
        p = await _paciente(client, "REGISTRO CORDIVA", op, empresa="cordiva")
        await _executar(client, "update", "patients", {
            "__op": "eventAppend",
            "event": {"_id": "reg-cor", "occurrenceDate": "2026-09-01",
                      "indicator": {"name": "09 - Ouvidoria"},
                      "subindicator": {"name": "9.4 - Elogio"},
                      "observations": "elogio da familia",
                      "catalogo": "recategorizacao-2026", "card": "09", "cod": "9.4",
                      "responsavel": "Enfermagem Healthmais"},
        }, id=str(p["_id"]))

        dados = await _painel(client)
        ev = next(e for e in dados["eventos"] if e["id"] == "reg-cor")
        assert ev["empresa"] == "cordiva"

    async def test_operadora_e_compartilhada_entre_empresas(self, client):
        """Operadora nao tem empresa: as duas atendem pelos mesmos convenios."""
        op = await _operadora(client, "Camperj")
        await _paciente(client, "DA CORDIVA", op, empresa="cordiva")

        dados = await _painel(client)
        assert "empresa" not in dados["operadoras"][0]
        assert dados["operadoras"][0]["nome"] == "Camperj"


class TestInativacaoAutomatica:
    """Alta e obito escondem o paciente da carteira. A regra le o catalogo.

    O catalogo novo reaproveita os prefixos do antigo com outro significado:
    "01 - Movimentacao da Carteira" / "1.1 - Admissao" batia na regra antiga
    ("01", "1.1", "alta") e inativava o paciente no ato de admiti-lo.
    """

    async def _com_evento(self, client, nome, evento):
        op = await _operadora(client)
        p = await _paciente(client, nome, op)
        await _executar(client, "update", "patients",
                        {"__op": "eventAppend", "event": evento}, id=str(p["_id"]))
        dados = await _painel(client)
        return next(x for x in dados["pacientes"] if x["nome"] == nome)

    def _novo(self, cod, rotulo, card="01", indicador="01 - Movimentação da Carteira"):
        return {"_id": "ev-" + cod, "occurrenceDate": "2026-09-01",
                "indicator": {"name": indicador},
                "subindicator": {"name": cod + " - " + rotulo},
                "observations": "registro de teste",
                "catalogo": "recategorizacao-2026", "card": card, "cod": cod,
                "responsavel": "Enfermagem Healthmais"}

    async def test_admissao_no_catalogo_novo_nao_inativa(self, client):
        p = await self._com_evento(client, "ADMITIDO", self._novo("1.1", "Admissão"))
        assert p["situacao"] == "ativo"
        assert p["motivo"] == ""

    async def test_alta_no_catalogo_novo_inativa_como_alta(self, client):
        p = await self._com_evento(client, "COM ALTA",
                                   self._novo("1.2", "Alta por objetivo terapêutico"))
        assert p["situacao"] == "inativo"
        assert p["motivo"] == "alta"

    async def test_obito_no_catalogo_novo_inativa_como_obito(self, client):
        p = await self._com_evento(client, "COM ÓBITO", self._novo("1.4", "Saída por óbito"))
        assert p["situacao"] == "inativo"
        assert p["motivo"] == "obito"

    async def test_saida_administrativa_nao_inativa_sozinha(self, client):
        """1.5 a 1.7 encerram o acompanhamento, mas nao viram alta nem obito.

        Sao os dois unicos motivos que o resto do sistema sabe tratar; ate o
        desfecho do episodio existir, essas saidas sao inativacao manual.
        """
        p = await self._com_evento(client, "DESLIGADO",
                                   self._novo("1.6", "Desligamento administrativo"))
        assert p["situacao"] == "ativo"

    async def test_catalogo_antigo_continua_valendo(self, client):
        p = await self._com_evento(client, "ALTA ANTIGA", {
            "_id": "ev-antigo", "occurrenceDate": "2026-05-01",
            "indicator": {"name": "01 - Indicador de Fluxo Assistencial"},
            "subindicator": {"name": "1.1 - Alta Domiciliar"}})
        assert p["situacao"] == "inativo"
        assert p["motivo"] == "alta"
