"""Monta o JSON do painel a partir do Mongo -- a base onde o sistema grava.

Por que existe
--------------
O painel e a pagina servida na raiz: e por ele que a assistencia entra. Ele
lia `/painel/dados`, que so respondia com Postgres configurado. `POSTGRES_URI`
nao tem default no docker-compose, entao em producao a chamada voltava 503 e a
tela caia no `dados.json` ao lado -- arquivo que o .gitignore barra e que a
imagem do frontend nao copia. Resultado: painel vazio para todo mundo, com o
banco cheio do outro lado.

Pior que vazio: o que a equipe grava vai para o Mongo pelo `/db/execute`, com
event store, soft update e SOFT_DELETE. Uma leitura presa num Postgres
carregado uma vez nunca veria nada disso -- gravar e nao aparecer e a falha que
mais custa confianca numa tela de indicador.

Esta leitura sai da mesma base em que a gravacao entra. As consultas SQL
continuam onde estao: elas provam que o schema novo reproduz esta saida, que e
o teste de aceite da migracao (`migration/postgres/painel_do_postgres.mjs`).
Mesma forma, mesmos nomes de campo -- e por isso a tela nao distingue as duas.
"""
import re
from datetime import datetime, timezone

EVENT_STORE = "events_store"

# Registro sem empresa e da HealthMais: e a unica que operou o sistema ate o
# painel ganhar o seletor. Mesmo default da coluna `patients.empresa`.
EMPRESA_PADRAO = "healthmais"

_ESPACO = re.compile(r"\s+")
_CODIGO = re.compile(r"^\s*(\d+)")


def _texto(v) -> str:
    """Colapsa espaco e apara -- a mesma normalizacao do regexp_replace no SQL.

    Sem isto, 33 observacoes diferiam do Postgres so por espaco no fim, e a
    conciliacao acusava divergencia onde nao havia.
    """
    return _ESPACO.sub(" ", (v or "").strip())


def _dia(v) -> str:
    """Timestamp do Mongo -> AAAA-MM-DD em UTC.

    UTC explicito, como o `AT TIME ZONE 'UTC'` das consultas: sem isso um
    registro perto da meia-noite cai num dia no servidor e noutro no dump.
    """
    if isinstance(v, datetime):
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc).strftime("%Y-%m-%d")
    if isinstance(v, str) and v:
        return v[:10]
    return ""


def _instante(v) -> str:
    if isinstance(v, datetime):
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    if isinstance(v, str) and v:
        return v[:19]
    return ""


def _id(v) -> str:
    return str(v) if v is not None else ""


def _situacao(p: dict) -> str:
    """Mesma regra da coluna gerada `situacao` do Postgres."""
    if p.get("deletedAt"):
        return "excluido"
    if p.get("inactive"):
        return "inativo"
    return "ativo"


async def montar(db) -> dict:
    """Devolve o mesmo dicionario que as consultas do Postgres produzem."""
    operadoras_raw = await db["operators"].find({"deletedAt": None}).to_list(length=1000)
    # Pacientes vem todos, inclusive excluidos: a pagina de inativos existe
    # justamente para mostrar quem a regra antiga escondia.
    pacientes_raw = await db["patients"].find({}).to_list(length=100000)
    usuarios_raw = await db["users"].find({"deletedAt": None}).to_list(length=1000)
    notif_raw = await db["notifications"].find({}).to_list(length=100000)
    trilha_raw = await db[EVENT_STORE].find({}).to_list(length=200000)
    triagem_raw = await db["social_assistance_reports"].find({}).to_list(length=100000)

    nome_operadora = {_id(o["_id"]): o.get("name", "") for o in operadoras_raw}

    def operadora_de(p: dict) -> str:
        op = p.get("operator")
        if isinstance(op, dict):
            return op.get("name") or nome_operadora.get(_id(op.get("_id")), "")
        return nome_operadora.get(_id(p.get("operatorId")), "")

    pacientes = []
    eventos = []
    por_operadora = {}
    for p in sorted(pacientes_raw, key=lambda x: (x.get("name") or "")):
        pid = _id(p["_id"])
        operadora = operadora_de(p)
        por_operadora[operadora] = por_operadora.get(operadora, 0) + 1
        eventos_do_paciente = p.get("events") or []
        pacientes.append({
            "id": pid,
            "nome": p.get("name", ""),
            "operadora": operadora,
            "empresa": p.get("empresa") or EMPRESA_PADRAO,
            "situacao": _situacao(p),
            "motivo": p.get("inactivationReason") or "",
            "nascimento": (p.get("birthDate") or "")[:10],
            "admissao": (p.get("admissionDate") or "")[:10],
            "eventos": len(eventos_do_paciente),
            "observacoes": _texto(p.get("observations")),
            "criado": _dia(p.get("createdAt")),
            "atualizado": _dia(p.get("updatedAt")),
            "atualizado_por": p.get("updatedBy") or "",
            "inativado": _dia(p.get("inactivatedAt")),
            "excluido": _dia(p.get("deletedAt")),
        })
        for e in eventos_do_paciente:
            indicador = (e.get("indicator") or {}).get("name", "")
            achou = _CODIGO.match(indicador)
            eventos.append({
                "id": _id(e.get("_id")),
                "paciente_id": pid,
                "paciente": p.get("name", ""),
                "operadora": operadora,
                # O evento herda a empresa do paciente: nao existe registro de
                # uma empresa preso a paciente de outra.
                "empresa": p.get("empresa") or EMPRESA_PADRAO,
                "data": (e.get("occurrenceDate") or "")[:10],
                "card": achou.group(1) if achou else "",
                "indicador": indicador,
                "subindicador": (e.get("subindicator") or {}).get("name", ""),
                "assistencia": e.get("assistanceType") or "",
                # Registro feito depois da recategorizacao ja nasce no
                # catalogo novo e nao precisa passar pelo de-para. Sem estes
                # dois campos, todo registro novo cairia em "Em triagem" --
                # com a categoria escolhida na hora, e sem nada a decidir.
                "catalogo": e.get("catalogo") or "",
                "cod": e.get("cod") or "",
                "responsavel": e.get("responsavel") or "",
                "observacoes": _texto(e.get("observations")),
                "anexo": bool(e.get("file")),
            })
    # Mesma ordem do SQL: ocorrencia mais recente primeiro.
    eventos.sort(key=lambda e: (e["data"] or "", e["id"]), reverse=True)

    operadoras = sorted(
        ({
            "id": _id(o["_id"]),
            "nome": o.get("name", ""),
            "criado": _dia(o.get("createdAt")),
            "pacientes": por_operadora.get(o.get("name", ""), 0),
        } for o in operadoras_raw),
        key=lambda o: o["nome"],
    )

    por_ator = {}
    auditoria = []
    for a in sorted(trilha_raw, key=lambda x: _instante(x.get("timestamp")), reverse=True):
        ator = a.get("actor") or ""
        por_ator[ator] = por_ator.get(ator, 0) + 1
        chaves = sorted((a.get("data") or {}).keys())
        auditoria.append({
            "id": _id(a["_id"]),
            "stream": a.get("streamType", ""),
            "stream_id": _id(a.get("streamId")),
            "tipo": a.get("eventType", ""),
            "versao": a.get("version", 0),
            "quando": _instante(a.get("timestamp")),
            "ator": ator,
            "campos": [k for k in chaves if not k.startswith("$")],
            "operadores": [k for k in chaves if k.startswith("$")],
        })

    usuarios = sorted(
        ({
            "id": _id(u["_id"]),
            "nome": u.get("name", ""),
            "email": u.get("email", ""),
            "dominio": (u.get("email") or "").split("@")[-1],
            "criado": _dia(u.get("createdAt")),
            "registros": por_ator.get(u.get("email", ""), 0),
        } for u in usuarios_raw),
        key=lambda u: -u["registros"],
    )

    notificacoes = [{
        "id": _id(n["_id"]),
        "titulo": n.get("title", "") or "",
        "mensagem": _texto(n.get("message")),
        "tipo": n.get("type", "") or "",
        "lida": bool(n.get("isRead")),
        "link": n.get("link", "") or "",
        "quando": _dia(n.get("createdAt")),
        "removida": n.get("deletedAt") is not None,
    } for n in sorted(notif_raw, key=lambda x: _instante(x.get("createdAt")), reverse=True)]

    triagem = [{
        "id": _id(r["_id"]),
        "nome_bruto": r.get("patientNameRaw", "") or "",
        "vinculado": bool(r.get("linkedPatientId")),
        "paciente": r.get("linkedPatientName", "") or "",
        "data": (r.get("occurrenceDate") or "")[:10],
        "indicador": (r.get("indicator") or {}).get("name", "") if isinstance(r.get("indicator"), dict) else "",
        "subindicador": (r.get("subindicator") or {}).get("name", "") if isinstance(r.get("subindicator"), dict) else "",
        "relator": r.get("reporterName", "") or "",
        "contato": r.get("reporterContact", "") or "",
        "observacoes": _texto(r.get("observations")),
        "status": r.get("status", "") or "",
    } for r in triagem_raw]

    return {
        "fonte": "mongo · base em uso",
        "operadoras": operadoras,
        "pacientes": pacientes,
        "eventos": eventos,
        "auditoria": auditoria,
        "notificacoes": notificacoes,
        "usuarios": usuarios,
        "triagem": triagem,
    }
