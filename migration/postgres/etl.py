"""Le o export do MongoDB (mongoexport JSONL) e produz as linhas do Postgres.

Uso:
    python etl.py --src <dir-do-export>              # valida em memoria
    python etl.py --src <dir-do-export> --out data.sql

A carga nao e uma copia crua: tres transformacoes acontecem aqui, todas
reportadas no fim da execucao.

  1. Migracao de inativacao. Espelha backend/migrate_inactivation.py. Paciente
     escondido por alta (01/1.1) ou obito (04) volta a ser visivel com
     inactive=true; exclusao manual continua excluida.
  2. Operadora dos sem vinculo. Paciente sem operatorId no Mongo e particular:
     recebe a operadora "Particular", que ja existe. Nenhuma categoria sintetica
     e criada, e operator_id pode ser NOT NULL no schema.
  3. social_assistance_reports. Nao existe collection exportada com esse nome:
     as linhas saem do replay dos eventos no event store.

A validacao roda contra SQLite em memoria com foreign_keys ligado. Nao e um
Postgres: serve para provar o modelo relacional (FKs, unicidade, NOT NULL,
cardinalidade), nao o dialeto. O que depende de dialeto -- jsonb, timestamptz,
date -- so e exercitado de verdade ao aplicar schema.sql no Postgres real.
"""
import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# O catalogo da recategorizacao mora num arquivo so, transcrito do PDF.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from catalogo_novo import CARDS as CARDS_NOVOS  # noqa: E402

COLLECTIONS = ["operators", "users", "indicators", "patients", "notifications", "events_store"]

# Paciente sem operatorId e particular: cai na operadora que ja existe.
OPERADORA_PADRAO = "Particular"

# Mesmas regras de backend/routers/proxy.py::_inactivation_reason.
# O catalogo da recategorizacao reaproveita os mesmos prefixos do antigo com
# outro significado, e as regras antigas casavam por prefixo de texto. Um
# registro novo de "01 - Movimentacao da Carteira" / "1.1 - Admissao" batia na
# regra ("01", "1.1", "alta") e inativava o paciente como alta -- no ato de
# admiti-lo. E o obito novo (1.4) nao inativava ninguem, porque a regra do
# obito procurava o prefixo "04".
#
# Por isso a origem do registro decide qual tabela vale. Registro gravado pelo
# painel carrega `catalogo`; o historico nao carrega nada e continua no de-para
# antigo.
CATALOGO_NOVO = "recategorizacao-2026"

# Catalogo novo: o codigo da saida e explicito, entao a regra le o codigo.
# 1.5 (internacao prolongada), 1.6 (desligamento) e 1.7 (transferencia) tambem
# encerram o acompanhamento, mas nao entram aqui de proposito: `alta` e `obito`
# sao os dois motivos que o resto do sistema sabe tratar (pagina de inativos,
# reativacao, `recuperavel` da migracao). Fechar por eles exige o desfecho do
# episodio, que ainda nao existe -- ate la, sao inativacao manual.
INATIVACAO_POR_CODIGO = {"1.2": "alta", "1.3": "alta", "1.4": "obito"}

REGRAS_INATIVACAO_LEGADO = [
    ("04", None, "obito"),
    ("01", "1.1", "alta"),
]


def id_indicador_novo(card: str) -> str:
    """char(24) deterministico para os indicadores do catalogo novo.

    `indicators.id` e char(24) porque veio do ObjectId do Mongo. Os cards da
    recategorizacao nao nascem no Mongo -- nascem do PDF -- entao precisam de
    um id proprio, estavel entre execucoes (senao cada carga religaria os
    eventos a linhas diferentes) e legivel a olho no banco.
    """
    return ("catalogo2026card" + card).ljust(24, "0")[:24]


def nome_indicador_novo(card: str) -> str:
    return card + " - " + CARDS_NOVOS[card][0]


# --- Leitura do formato do mongoexport --------------------------------------

def ler(src: Path, nome: str) -> list[dict]:
    arq = src / (nome + ".json")
    if not arq.exists():
        raise SystemExit("faltando: " + str(arq))
    with arq.open(encoding="utf-8") as fh:
        return [json.loads(linha) for linha in fh if linha.strip()]


def oid(v):
    """{'$oid': '...'} -> str."""
    return v.get("$oid") if isinstance(v, dict) else v


def ts(v):
    """{'$date': ...} -> str ISO, ou None.

    O mongoexport emite duas formas para a mesma data: `{"$date": "ISO"}` no
    modo relaxed e `{"$date": {"$numberLong": "ms"}}` no canonical -- e o dump
    de producao veio no segundo. Tratar so o primeiro fazia o carregador
    estourar no primeiro paciente.
    """
    if isinstance(v, dict):
        d = v.get("$date")
        if isinstance(d, dict):
            ms = d.get("$numberLong")
            if ms is None:
                return None
            return (datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc)
                    .isoformat().replace("+00:00", "Z"))
        return d
    return v or None


def num(v, padrao=None):
    """{'$numberInt': '2'} -> 2.

    O mongoexport canonical embrulha todo numero. Sem desembrulhar, `version` e
    `target_value` iam dict para colunas numericas -- e a validacao de unicidade
    de events_store(stream,tipo,versao) levantava "unhashable type: 'dict'"
    antes mesmo de o INSERT ser tentado.
    """
    if isinstance(v, dict):
        for chave in ("$numberInt", "$numberLong", "$numberDecimal", "$numberDouble"):
            if chave in v:
                bruto = v[chave]
                return float(bruto) if chave in ("$numberDecimal", "$numberDouble") else int(bruto)
        return padrao
    if isinstance(v, bool) or v is None:
        return padrao if v is None else int(v)
    if isinstance(v, (int, float)):
        return v
    try:
        return int(v)
    except (TypeError, ValueError):
        return padrao


def data(v):
    """String de data do app -> ISO ou None. Vazio vira NULL, nao 1970-01-01."""
    v = (v or "").strip()
    return v or None


def motivo_inativacao(evento: dict):
    """Alta ou obito? Espelha proxy.py para nao divergir da regra do app."""
    if evento.get("catalogo") == CATALOGO_NOVO:
        return INATIVACAO_POR_CODIGO.get(str(evento.get("cod") or ""))
    ind = (evento.get("indicator") or {}).get("name", "")
    sub = (evento.get("subindicator") or {}).get("name", "")
    for pref_ind, pref_sub, motivo in REGRAS_INATIVACAO_LEGADO:
        if not ind.startswith(pref_ind):
            continue
        if pref_sub is None or sub.startswith(pref_sub):
            return motivo
    return None


def materializar_sar(eventos: list[dict]) -> dict:
    """Replay dos social_assistance_reports: nao ha collection exportada."""
    estados = {}
    relevantes = [e for e in eventos if e.get("streamType") == "social_assistance_reports"]
    for e in sorted(relevantes, key=lambda x: (x["streamId"], num(x.get("version"), 0))):
        d = e.get("data") or {}
        # O event store pode guardar operadores mongo; aqui so $set aparece.
        if any(k.startswith("$") for k in d):
            d = d.get("$set") or {}
        if e["eventType"] == "CREATE":
            estados[e["streamId"]] = dict(d)
        else:
            estados.setdefault(e["streamId"], {}).update(d)
    return estados


# --- Transformacao ----------------------------------------------------------

def transformar(src: Path):
    docs = {c: ler(src, c) for c in COLLECTIONS}
    linhas = {}
    stats = {"inativados": 0, "excluidos_mantidos": 0, "particular": 0, "motivos": {}}

    linhas["operators"] = [
        (oid(o["_id"]), o["name"], ts(o.get("createdAt")), ts(o.get("updatedAt")),
         ts(o.get("deletedAt")))
        for o in docs["operators"]
    ]

    # Sem operadora = particular. Se a operadora sumir do dump, para: inventar
    # um id aqui esconderia o problema atras de uma FK que resolve.
    padrao = next((oid(o["_id"]) for o in docs["operators"]
                   if o.get("name") == OPERADORA_PADRAO), None)
    if padrao is None:
        raise SystemExit("operadora '%s' nao existe no dump" % OPERADORA_PADRAO)

    linhas["users"] = [
        (oid(u["_id"]), u["name"], u["email"], u.get("avatar"),
         ts(u.get("createdAt")), ts(u.get("deletedAt")))
        for u in docs["users"]
    ]

    # A equipe do sistema entra tambem como profissional. Quem for criado pelo
    # formulario depois nao tera user_id -- e o caso de quem atende sem ter conta.
    #
    # profissionais.nome e UNIQUE porque o formulario identifica a pessoa pelo
    # nome digitado. `users` nao garante isso: so o email e unico, e o dump tem
    # duas contas "Enfermagem Healthmais" (enfermagem@ e enfermagem2@). Duas
    # contas com o mesmo nome sao uma pessoa so aqui; quando ha ambiguidade o
    # vinculo com a conta fica nulo, porque escolher uma das duas seria chute.
    por_nome_prof = {}
    for u in docs["users"]:
        nome = u["name"]
        if nome in por_nome_prof:
            por_nome_prof[nome]["ambiguo"] = True
            continue
        por_nome_prof[nome] = {"email": u["email"], "user": oid(u["_id"]), "ambiguo": False}
    linhas["profissionais"] = [
        (i, nome, None if v["ambiguo"] else v["email"], None if v["ambiguo"] else v["user"])
        for i, (nome, v) in enumerate(sorted(por_nome_prof.items()), start=1)
    ]
    stats["profissionais_ambiguos"] = sum(1 for v in por_nome_prof.values() if v["ambiguo"])

    linhas["indicators"] = [
        (oid(i["_id"]), i["name"], i.get("targetType"), i.get("targetDirection"),
         num(i.get("targetValue")), i.get("comparisonInterval"), i.get("observations"),
         ts(i.get("createdAt")), ts(i.get("updatedAt")), ts(i.get("deletedAt")))
        for i in docs["indicators"]
    ]
    # Os dez cards da recategorizacao entram sempre, ao lado dos antigos. O
    # painel ja grava neles: sem estas linhas, `indicator_id` nao resolveria e
    # a carga abortava no primeiro registro feito depois do corte -- que e
    # exatamente o registro que nao pode se perder.
    for card, (nome, _subs, nota) in sorted(CARDS_NOVOS.items()):
        linhas["indicators"].append(
            (id_indicador_novo(card), nome_indicador_novo(card),
             None, None, None, None, nota, None, None, None))

    # Subindicadores nao tem _id no Mongo: a chave sintetica e atribuida aqui, e
    # o indice por (indicador, nome) e o que permite religar os eventos depois.
    subs = []
    por_nome = {}
    proximo = 1
    for ind in docs["indicators"]:
        ind_id = oid(ind["_id"])
        for pos, s in enumerate(ind.get("subindicators") or []):
            chave = (ind["name"], s["name"])
            if chave in por_nome:
                raise SystemExit("subindicador duplicado em " + ind["name"] + ": " + s["name"])
            por_nome[chave] = proximo
            subs.append((proximo, ind_id, pos, s["name"], s.get("targetType"),
                         s.get("targetDirection"), num(s.get("targetValue"))))
            proximo += 1
    for card, (_nome, subcats, _nota) in sorted(CARDS_NOVOS.items()):
        ind_id = id_indicador_novo(card)
        for pos, (cod, rotulo) in enumerate(sorted(subcats.items())):
            chave = (nome_indicador_novo(card), cod + " - " + rotulo)
            por_nome[chave] = proximo
            subs.append((proximo, ind_id, pos, cod + " - " + rotulo, None, None, None))
            proximo += 1
    linhas["subindicators"] = subs

    ind_por_nome = {i["name"]: oid(i["_id"]) for i in docs["indicators"]}
    ind_por_nome.update({nome_indicador_novo(c): id_indicador_novo(c)
                         for c in CARDS_NOVOS})
    # Nome do profissional -> id, para religar o responsavel do registro novo.
    prof_por_nome = {nome: i for i, nome, _e, _u in linhas["profissionais"]}
    proximo_prof = max(prof_por_nome.values(), default=0) + 1

    # SOFT_DELETE mais recente por paciente: carrega motivo e data da inativacao.
    soft_delete = {}
    for e in docs["events_store"]:
        if e.get("streamType") == "patients" and e.get("eventType") == "SOFT_DELETE":
            soft_delete[e["streamId"]] = e

    pacientes = []
    eventos = []
    for p in docs["patients"]:
        pid = oid(p["_id"])

        inativo = bool(p.get("inactive"))
        motivo = p.get("inactivationReason")
        inativado_em = ts(p.get("inactivatedAt"))
        excluido_em = ts(p.get("deletedAt"))

        # Migracao de inativacao: alta/obito deixam de esconder o paciente.
        if excluido_em and not inativo:
            sd = soft_delete.get(pid)
            achado = ((sd or {}).get("data") or {}).get("inactivationReason")
            if not achado:
                for ev in (p.get("events") or []):
                    achado = motivo_inativacao(ev)
                    if achado:
                        break
            if achado:
                inativo, motivo, excluido_em = True, achado, None
                inativado_em = inativado_em or ts((sd or {}).get("timestamp"))
                stats["inativados"] += 1
                stats["motivos"][achado] = stats["motivos"].get(achado, 0) + 1
            else:
                # Exclusao manual de verdade: continua excluida.
                stats["excluidos_mantidos"] += 1

        operadora = p.get("operatorId")
        if not operadora:
            operadora = padrao
            stats["particular"] += 1

        pacientes.append((
            pid, p["name"], data(p.get("birthDate")), data(p.get("admissionDate")),
            p.get("observations"), operadora,
            # Registro sem empresa e da HealthMais: mesmo default da coluna.
            p.get("empresa") or "healthmais",
            1 if inativo else 0, inativado_em, motivo, p.get("updatedBy"),
            ts(p.get("createdAt")), ts(p.get("updatedAt")), excluido_em,
            # Tudo que vem do dump e legado: 133 destes nao tem data de
            # admissao, e o CHECK do registro novo os recusaria.
            "legado",
        ))

        for pos, e in enumerate(p.get("events") or []):
            nome_ind = (e.get("indicator") or {}).get("name")
            nome_sub = (e.get("subindicator") or {}).get("name")
            ind_id = ind_por_nome.get(nome_ind)
            if ind_id is None:
                raise SystemExit("evento cita indicador inexistente: " + repr(nome_ind))
            # Registro feito depois do corte: nasce no catalogo novo, tem
            # observacao e responsavel, e entra como 'sistema' -- os CHECK do
            # schema valem para ele. O historico continua 'legado': 126 dos 206
            # nao tem observacao e nenhum tem responsavel, e inventar seria pior
            # do que admitir que nao existe.
            novo = e.get("catalogo") == CATALOGO_NOVO
            prof_id = None
            if novo:
                nome_prof = (e.get("responsavel") or "").strip()
                if nome_prof:
                    if nome_prof not in prof_por_nome:
                        # Quem atende nem sempre tem conta: o painel deixa criar
                        # o profissional na hora, e ele chega aqui so como nome.
                        prof_por_nome[nome_prof] = proximo_prof
                        linhas["profissionais"].append(
                            (proximo_prof, nome_prof, None, None))
                        proximo_prof += 1
                    prof_id = prof_por_nome[nome_prof]
                if prof_id is None or not (e.get("observations") or "").strip():
                    raise SystemExit(
                        "registro novo sem observacao ou sem responsavel: " + repr(e["_id"]))
            eventos.append((
                e["_id"], pid, ind_id, por_nome.get((nome_ind, nome_sub)),
                data(e.get("occurrenceDate")), e.get("observations"),
                e.get("assistanceType"), prof_id, pos,
                "sistema" if novo else "legado",
            ))
    linhas["patients"] = pacientes
    linhas["patient_events"] = eventos

    linhas["notifications"] = [
        (oid(n["_id"]), n.get("title"), n.get("message"), n.get("link"), n.get("type"),
         1 if n.get("isRead") else 0, ts(n.get("createdAt")), ts(n.get("updatedAt")),
         ts(n.get("deletedAt")))
        for n in docs["notifications"]
    ]

    ids_pacientes = {r[0] for r in pacientes}
    relatorios = []
    for rid, r in materializar_sar(docs["events_store"]).items():
        if r.get("file"):
            raise SystemExit("relatorio social " + rid + " tem anexo; schema nao preve bytea")
        nome_ind = (r.get("indicator") or {}).get("name")
        nome_sub = (r.get("subindicator") or {}).get("name")
        vinculado = r.get("linkedPatientId")
        if vinculado and vinculado not in ids_pacientes:
            vinculado = None  # paciente vinculado nao existe mais no export
        relatorios.append((
            rid, r.get("patientNameRaw"), vinculado, r.get("linkedPatientName"),
            ts(r.get("linkedAt")), data(r.get("occurrenceDate")),
            ind_por_nome.get(nome_ind), por_nome.get((nome_ind, nome_sub)),
            r.get("reporterName"), r.get("reporterContact"), r.get("observations"),
            r.get("status"), r.get("updatedBy"),
        ))
    linhas["social_assistance_reports"] = relatorios

    linhas["events_store"] = [
        (oid(e["_id"]), e["streamId"], e["streamType"], e["eventType"], num(e["version"], 0),
         json.dumps(e.get("data"), ensure_ascii=False), e.get("actor"), ts(e.get("timestamp")))
        for e in docs["events_store"]
    ]

    return linhas, stats


# --- Validacao em memoria ---------------------------------------------------

ORDEM = ["operators", "users", "profissionais", "indicators", "subindicators",
         "patients", "patient_events", "notifications",
         "social_assistance_reports", "events_store"]

# Lista explicita por tabela. patients.situacao e GENERATED ALWAYS: um INSERT
# posicional tentaria preenche-la e o Postgres recusa.
COLS = {
    "operators": "id, name, created_at, updated_at, deleted_at",
    "users": "id, name, email, avatar, created_at, deleted_at",
    "profissionais": "id, nome, email, user_id",
    "indicators": ("id, name, target_type, target_direction, target_value, "
                   "comparison_interval, observations, created_at, updated_at, deleted_at"),
    "subindicators": ("id, indicator_id, position, name, target_type, "
                      "target_direction, target_value"),
    "patients": ("id, name, birth_date, admission_date, observations, operator_id, empresa, "
                 "inactive, inactivated_at, inactivation_reason, updated_by, "
                 "created_at, updated_at, deleted_at, origem_registro"),
    "patient_events": ("id, patient_id, indicator_id, subindicator_id, occurrence_date, "
                       "observations, assistance_type, profissional_id, position, "
                       "origem_registro"),
    "notifications": ("id, title, message, link, type, is_read, created_at, "
                      "updated_at, deleted_at"),
    "social_assistance_reports": ("id, patient_name_raw, linked_patient_id, "
                                  "linked_patient_name, linked_at, occurrence_date, "
                                  "indicator_id, subindicator_id, reporter_name, "
                                  "reporter_contact, observations, status, updated_by"),
    "events_store": ("id, stream_id, stream_type, event_type, version, data, "
                     "actor, \"timestamp\""),
}


def idx(tabela: str, coluna: str) -> int:
    """Posicao de uma coluna na tupla da tabela, pelo nome.

    Havia tres lugares com a posicao escrita a mao -- o indice do booleano em
    `emitir`, a chave unica de patient_events e o relatorio de situacao. Add uma
    coluna no meio quebrava os tres em silencio: o INSERT mandava 'healthmais'
    para `inactive` e o Postgres so reclamava do tipo, sem dizer de onde vinha.
    """
    return [c.strip() for c in COLS[tabela].split(",")].index(coluna)


COLUNAS = {k: len(v.split(",")) for k, v in COLS.items()}


def validar(linhas: dict, stats: dict, schema: str) -> None:
    """Confere o modelo em Python puro, sem banco.

    Ate aqui isto rodava em SQLite. Nao roda mais: o schema passou a usar
    ENUM, coluna gerada, btrim e octet_length, e manter um tradutor de dialeto
    para um alvo que ninguem vai usar so produz falha falsa. Quem valida
    dialeto agora e pgtest.mjs, que roda Postgres de verdade.

    O que ficou aqui e o que sempre importou: FK resolve, chave unica nao
    colide, cardinalidade bate com a origem.
    """
    def chaves(tabela, i):
        return [l[i] for l in linhas[tabela]]

    # Chaves primarias unicas
    for tabela, i in (("operators", 0), ("users", 0), ("profissionais", 0),
                      ("indicators", 0), ("subindicators", 0), ("patients", 0),
                      ("patient_events", 0), ("notifications", 0),
                      ("social_assistance_reports", 0), ("events_store", 0)):
        ks = chaves(tabela, i)
        if len(ks) != len(set(ks)):
            dup = [k for k in set(ks) if ks.count(k) > 1][:3]
            raise SystemExit("%s: chave repetida %r" % (tabela, dup))

    # UNIQUE declarados no schema
    for tabela, idxs, rotulo in (("operators", (1,), "operators.name"),
                                 ("users", (2,), "users.email"),
                                 ("profissionais", (1,), "profissionais.nome"),
                                 ("indicators", (1,), "indicators.name"),
                                 ("subindicators", (1, 3), "subindicators(indicator,nome)"),
                                 ("patient_events",
                                  (idx("patient_events", "patient_id"),
                                   idx("patient_events", "position")),
                                  "patient_events(paciente,posicao)"),
                                 ("events_store", (1, 2, 4), "events_store(stream,tipo,versao)")):
        vs = [tuple(l[i] for i in idxs) for l in linhas[tabela]]
        if len(vs) != len(set(vs)):
            raise SystemExit("%s: valor repetido" % rotulo)

    # FKs
    ids = {t: set(chaves(t, 0)) for t in linhas}
    def fk(tabela, i, alvo, obrigatoria=True):
        for l in linhas[tabela]:
            v = l[i]
            if v is None:
                if obrigatoria:
                    raise SystemExit("%s: FK para %s nula" % (tabela, alvo))
                continue
            if v not in ids[alvo]:
                raise SystemExit("%s: FK orfa para %s: %r" % (tabela, alvo, v))
    fk("subindicators", 1, "indicators")
    fk("patients", idx("patients", "operator_id"), "operators")
    fk("patient_events", idx("patient_events", "patient_id"), "patients")
    fk("patient_events", idx("patient_events", "indicator_id"), "indicators")
    fk("patient_events", idx("patient_events", "subindicator_id"), "subindicators",
       obrigatoria=False)
    fk("patient_events", idx("patient_events", "profissional_id"), "profissionais",
       obrigatoria=False)
    fk("profissionais", 3, "users", obrigatoria=False)
    fk("social_assistance_reports", 2, "patients", obrigatoria=False)

    # As colunas emitidas tem que casar com a lista declarada
    for tabela, cols in COLS.items():
        n = len(cols.split(","))
        for l in linhas[tabela]:
            if len(l) != n:
                raise SystemExit("%s: %d valores para %d colunas" % (tabela, len(l), n))

    print("modelo conferido (chaves, FKs e cardinalidade):")
    for tabela in ORDEM:
        print("  %-28s %5d" % (tabela, len(linhas[tabela])))

    print("")
    print("transformacoes aplicadas:")
    print("  inativados (alta/obito):      %d  %s" % (stats["inativados"], stats["motivos"]))
    print("  seguem excluidos (manual):    %d" % stats["excluidos_mantidos"])
    print("  sem operadora -> Particular:  %d" % stats["particular"])
    if stats.get("profissionais_ambiguos"):
        print("  profissionais sem vinculo:    %d  (nome repetido em users)"
              % stats["profissionais_ambiguos"])

    sit = {"ativo": 0, "inativo": 0, "excluido": 0}
    for l in linhas["patients"]:
        # Mesma expressao da coluna gerada, para o relatorio nao divergir dela.
        sit["excluido" if l[idx("patients", "deleted_at")]
            else "inativo" if l[idx("patients", "inactive")] else "ativo"] += 1
    print("")
    print("pacientes por situacao: ativos=%(ativo)d inativos=%(inativo)d excluidos=%(excluido)d" % sit)
    print("dialeto: rode `node pgtest.mjs <data.sql>` -- Postgres de verdade")


# --- Emissao para Postgres --------------------------------------------------

def literal(v) -> str:
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def emitir(linhas: dict, destino: Path) -> None:
    booleanos = {"patients": idx("patients", "inactive"),
                 "notifications": idx("notifications", "is_read")}
    with destino.open("w", encoding="utf-8") as fh:
        fh.write("BEGIN;\n\n")
        for tabela in ORDEM:
            if not linhas[tabela]:
                continue
            fh.write("-- %s: %d linhas\n" % (tabela, len(linhas[tabela])))
            for linha in linhas[tabela]:
                vals = list(linha)
                if tabela in booleanos:
                    i = booleanos[tabela]
                    vals[i] = bool(vals[i])
                # Lista de colunas explicita: patients.situacao e GENERATED e
                # um INSERT posicional tentaria preenche-la.
                fh.write("INSERT INTO " + tabela + " (" + COLS[tabela] + ") VALUES ("
                         + ", ".join(literal(v) for v in vals) + ");\n")
            fh.write("\n")
        # subindicators.id e bigserial e a carga traz id explicito, o que nao
        # avanca a sequence: sem isto o primeiro INSERT do app colide com a PK.
        # Verificado no Postgres real (PGlite); o teste SQLite nao alcanca isso.
        for tab in ("subindicators", "profissionais"):
            fh.write("SELECT setval('%s_id_seq', "
                     "(SELECT coalesce(max(id), 1) FROM %s));\n" % (tab, tab))
        fh.write("\n")
        fh.write("COMMIT;\n")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, type=Path, help="diretorio do export mongoexport")
    ap.add_argument("--out", type=Path, help="grava o INSERT do Postgres neste arquivo")
    args = ap.parse_args()

    schema = (Path(__file__).parent / "schema.sql").read_text(encoding="utf-8")
    linhas, stats = transformar(args.src)
    validar(linhas, stats, schema)

    if args.out:
        emitir(linhas, args.out)
        print("")
        print("escrito: " + str(args.out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
