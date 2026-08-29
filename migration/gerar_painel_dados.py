# -*- coding: utf-8 -*-
"""Monta o dados.json que alimenta as páginas de Operação do painel.

    python gerar_painel_dados.py --src <dir-do-export> --out <dir-do-prototipo>

Um arquivo só, com uma chave por página. O painel lê o que precisa e cai em
exemplo fictício se o arquivo não estiver servido ao lado.

CONTÉM NOME DE PACIENTE E OBSERVAÇÃO CLÍNICA. O destino padrão
(docs/novo-modelo/prototipo) está no .gitignore — o arquivo nunca é versionado.
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "postgres"))

from etl import motivo_inativacao  # noqa: E402  mesma regra do import Postgres
from fase1_inventario import classificar, ler_pacientes, prefixo  # noqa: E402

COLECOES = ["operators", "users", "indicators", "notifications", "events_store"]

# Paciente sem operatorId e particular.
OPERADORA_PADRAO = "Particular"


def ler(src: Path, nome: str) -> list:
    arq = src / (nome + ".json")
    if not arq.exists():
        return []
    with arq.open(encoding="utf-8") as fh:
        return [json.loads(l) for l in fh if l.strip()]


def oid(v):
    return v.get("$oid") if isinstance(v, dict) else v


def ts(v):
    if isinstance(v, dict):
        return v.get("$date")
    return v or None


def dia(v):
    """Timestamp ISO -> AAAA-MM-DD."""
    s = ts(v) or ""
    return s[:10] or None


def limpa(s, n=220):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    return s[:n]


# ─── Páginas ──────────────────────────────────────────────────────

def pg_pacientes(pacientes, operadoras, store):
    """Fiel ao dump: mostra o estado de hoje, com deletedAt e inactive como estao.

    Marca a parte, em `recuperavel`, quem a migracao de inativacao traria de
    volta como inativo. Sem isso a pagina mostraria 61 excluidos enquanto a
    Migracao mostra 50, sem explicar a diferenca.
    """
    op = {oid(o["_id"]): o["name"] for o in operadoras}
    soft = {}
    for e in store:
        if e.get("streamType") == "patients" and e.get("eventType") == "SOFT_DELETE":
            soft[e["streamId"]] = e
    saida = []
    for p in pacientes:
        eventos = p.get("events") or []
        situacao = ("excluido" if p.get("deletedAt")
                    else "inativo" if p.get("inactive") else "ativo")

        recuperavel = ""
        if situacao == "excluido":
            sd = soft.get(oid(p["_id"]))
            achado = ((sd or {}).get("data") or {}).get("inactivationReason")
            if not achado:
                for ev in (p.get("events") or []):
                    achado = motivo_inativacao(ev)
                    if achado:
                        break
            recuperavel = achado or ""
        saida.append({
            "id": oid(p["_id"]),
            "nome": p.get("name", ""),
            "operadora": op.get(p.get("operatorId"), OPERADORA_PADRAO),
            "situacao": situacao,
            "motivo": p.get("inactivationReason") or "",
            "nascimento": (p.get("birthDate") or "").strip(),
            "admissao": (p.get("admissionDate") or "").strip(),
            "eventos": len(eventos),
            "observacoes": limpa(p.get("observations")),
            "criado": dia(p.get("createdAt")),
            "atualizado": dia(p.get("updatedAt")),
            "atualizado_por": p.get("updatedBy") or "",
            "inativado": (ts(p.get("inactivatedAt")) or "")[:10],
            "excluido": dia(p.get("deletedAt")),
            "recuperavel": recuperavel,
        })
    saida.sort(key=lambda r: r["nome"])
    return saida


def pg_eventos(pacientes, operadoras):
    op = {oid(o["_id"]): o["name"] for o in operadoras}
    saida = []
    for p in pacientes:
        for ev in (p.get("events") or []):
            ind = (ev.get("indicator") or {}).get("name", "")
            sub = (ev.get("subindicator") or {}).get("name", "")
            saida.append({
                "id": ev.get("_id", ""),
                "paciente_id": oid(p["_id"]),
                "paciente": p.get("name", ""),
                "operadora": op.get(p.get("operatorId"), OPERADORA_PADRAO),
                "data": (ev.get("occurrenceDate") or "").strip(),
                "card": prefixo(ind),
                "indicador": ind,
                "subindicador": sub,
                "assistencia": ev.get("assistanceType") or "",
                "observacoes": limpa(ev.get("observations"), 400),
                "anexo": bool(ev.get("file")),
            })
    saida.sort(key=lambda r: r["data"] or "", reverse=True)
    return saida


def pg_auditoria(store):
    saida = []
    for e in store:
        d = e.get("data")
        if isinstance(d, dict):
            campos = sorted(k for k in d if not k.startswith("$"))
            operadores = sorted(k for k in d if k.startswith("$"))
        else:
            campos, operadores = [], []
        saida.append({
            "id": oid(e["_id"]),
            "stream": e.get("streamType", ""),
            "stream_id": e.get("streamId", ""),
            "tipo": e.get("eventType", ""),
            "versao": e.get("version", 0),
            "quando": ts(e.get("timestamp")),
            "ator": e.get("actor") or "",
            "campos": campos[:8],
            "operadores": operadores,
        })
    saida.sort(key=lambda r: r["quando"] or "", reverse=True)
    return saida


def pg_notificacoes(notificacoes):
    saida = [{
        "id": oid(n["_id"]),
        "titulo": n.get("title", ""),
        "mensagem": limpa(n.get("message"), 300),
        "tipo": n.get("type", ""),
        "lida": bool(n.get("isRead")),
        "link": n.get("link", ""),
        "quando": dia(n.get("createdAt")),
        "removida": bool(n.get("deletedAt")),
    } for n in notificacoes]
    saida.sort(key=lambda r: r["quando"] or "", reverse=True)
    return saida


def pg_usuarios(usuarios, store):
    # Quantos registros cada pessoa gravou, pelo ator do event store.
    porator = Counter(e.get("actor") or "" for e in store)
    saida = [{
        "id": oid(u["_id"]),
        "nome": u.get("name", ""),
        "email": u.get("email", ""),
        "dominio": (u.get("email") or "").split("@")[-1],
        "criado": dia(u.get("createdAt")),
        "registros": porator.get(u.get("email", ""), 0),
    } for u in usuarios]
    saida.sort(key=lambda r: -r["registros"])
    return saida


def pg_triagem(store, pacientes):
    """social_assistance_reports não tem collection: sai do replay do store."""
    ids = {oid(p["_id"]) for p in pacientes}
    estados = {}
    relevantes = [e for e in store if e.get("streamType") == "social_assistance_reports"]
    for e in sorted(relevantes, key=lambda x: (x["streamId"], x["version"])):
        d = e.get("data") or {}
        if any(k.startswith("$") for k in d):
            d = d.get("$set") or {}
        if e["eventType"] == "CREATE":
            estados[e["streamId"]] = dict(d)
        else:
            estados.setdefault(e["streamId"], {}).update(d)
    saida = []
    for rid, r in estados.items():
        vinc = r.get("linkedPatientId")
        saida.append({
            "id": rid,
            "nome_bruto": r.get("patientNameRaw", ""),
            "vinculado": bool(vinc and vinc in ids),
            "paciente": r.get("linkedPatientName") or "",
            "data": (r.get("occurrenceDate") or "").strip(),
            "indicador": (r.get("indicator") or {}).get("name", ""),
            "subindicador": (r.get("subindicator") or {}).get("name", ""),
            "relator": r.get("reporterName", ""),
            "contato": r.get("reporterContact", ""),
            "observacoes": limpa(r.get("observations"), 400),
            "status": r.get("status", ""),
        })
    return saida


def pg_relatorios(eventos, indicadores):
    """Pivô mensal indicador x mês, sobre os eventos reais."""
    meses = sorted({e["data"][:7] for e in eventos if e["data"]})
    porind = defaultdict(lambda: defaultdict(int))
    porsub = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for e in eventos:
        if not e["data"]:
            continue
        m = e["data"][:7]
        porind[e["indicador"]][m] += 1
        porsub[e["indicador"]][e["subindicador"]][m] += 1
    linhas = []
    for ind in sorted(porind, key=lambda x: prefixo(x)):
        linhas.append({
            "nivel": "indicador", "nome": ind,
            "meses": {m: porind[ind].get(m, 0) for m in meses},
            "total": sum(porind[ind].values()),
        })
        for sub in sorted(porsub[ind], key=lambda x: prefixo(x)):
            linhas.append({
                "nivel": "subindicador", "nome": sub,
                "meses": {m: porsub[ind][sub].get(m, 0) for m in meses},
                "total": sum(porsub[ind][sub].values()),
            })
    return {"meses": meses, "linhas": linhas}


def pg_certificados(usuarios):
    """Não há dado de certificado no dump: a página diz isso, com o que existe."""
    return {
        "emitidos": 0,
        "fonte": "Nenhum registro de emissão existe no dump de 28/08/2026.",
        "possiveis_emissores": len(usuarios),
    }


def pg_fechamento(pacientes, eventos, triagem, ambiguos, decisoes_pendentes):
    """Pendências reais que barrariam o fechamento da competência."""
    sem_nascimento = sum(1 for p in pacientes if not p["nascimento"])
    sem_admissao = sum(1 for p in pacientes if not p["admissao"])
    sem_operadora = sum(1 for p in pacientes if not p["operadora"])
    sem_obs = sum(1 for e in eventos if not e["observacoes"])
    triagem_aberta = sum(1 for t in triagem if not t["vinculado"])
    # Usa `recuperavel`, nao `motivo`: dos 61 excluidos, 11 voltam pela migracao.
    # Contar os 61 aqui divergiria da tela de Pacientes inativos.
    excluidos_sem_motivo = sum(
        1 for p in pacientes if p["situacao"] == "excluido" and not p["recuperavel"])

    itens = [
        {"regra": "Ambíguos da migração sem decisão", "qtd": decisoes_pendentes,
         "bloqueia": True,
         "detalhe": "A Fase 2 precisa terminar antes de o loader rodar."},
        {"regra": "Pacientes sem data de nascimento", "qtd": sem_nascimento,
         "bloqueia": True,
         "detalhe": "Campo obrigatório no registro de admissão do modelo novo."},
        {"regra": "Pacientes sem data de admissão", "qtd": sem_admissao,
         "bloqueia": True,
         "detalhe": "Sem ela não há episódio de cuidado: é a data que o abre."},
        {"regra": "Pacientes sem operadora", "qtd": sem_operadora,
         "bloqueia": True,
         "detalhe": "Resolvido: sem vínculo significa particular, e a operadora já existe."},
        {"regra": "Registros do formulário público sem vínculo", "qtd": triagem_aberta,
         "bloqueia": True,
         "detalhe": "Enquanto pendente, o registro não entra em indicador nenhum."},
        {"regra": "Excluídos sem motivo registrado", "qtd": excluidos_sem_motivo,
         "bloqueia": False,
         "detalhe": "Exclusão manual antiga: nem alta nem óbito a justifica, então a migração não a recupera."},
        {"regra": "Eventos sem observação", "qtd": sem_obs,
         "bloqueia": False,
         "detalhe": "Não bloqueia, mas é o que deixa o ambíguo sem como decidir."},
    ]
    return {
        "competencia": "08/2026",
        "bloqueios": sum(i["qtd"] for i in itens if i["bloqueia"]),
        "avisos": sum(i["qtd"] for i in itens if not i["bloqueia"]),
        "itens": itens,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    pacientes_raw = ler_pacientes(args.src)
    dados = {c: ler(args.src, c) for c in COLECOES}

    linhas = classificar(pacientes_raw)
    ambiguos = [l for l in linhas if l["tipo"] in ("ambiguo", "sem_regra")]

    pacientes = pg_pacientes(pacientes_raw, dados["operators"], dados["events_store"])
    eventos = pg_eventos(pacientes_raw, dados["operators"])
    triagem = pg_triagem(dados["events_store"], pacientes_raw)

    saida = {
        "gerado": "2026-08-29",
        "competencia": "08/2026",
        "fonte": "export de producao 2026-08-28",
        "migracao": [{k: l.get(k, "") for k in (
            "evento_id", "paciente_id", "paciente", "data", "subindicador_antigo",
            "indicador_antigo", "observacoes_raw", "pista", "sugestao", "sugestao_nome",
            "confianca", "motivo_sugestao", "opcoes", "destino", "destino_nome", "nota",
        )} for l in ambiguos],
        "pacientes": pacientes,
        "eventos": eventos,
        "auditoria": pg_auditoria(dados["events_store"]),
        "notificacoes": pg_notificacoes(dados["notifications"]),
        "usuarios": pg_usuarios(dados["users"], dados["events_store"]),
        "triagem": triagem,
        "relatorios": pg_relatorios(eventos, dados["indicators"]),
        "certificados": pg_certificados(dados["users"]),
        "fechamento": pg_fechamento(pacientes, eventos, triagem, ambiguos, len(ambiguos)),
    }

    # Ordena os ambíguos do mais difícil para o mais fácil, como na tela avulsa.
    ordem = {"nenhuma": 0, "baixa": 1, "media": 2, "alta": 3}
    saida["migracao"].sort(key=lambda a: (ordem.get(a["confianca"], 9), a["subindicador_antigo"]))

    args.out.mkdir(parents=True, exist_ok=True)
    destino = args.out / "dados.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, separators=(",", ":")),
                       encoding="utf-8")

    print("gravado: %s (%.0f KB)" % (destino, destino.stat().st_size / 1024))
    for k in ("migracao", "pacientes", "eventos", "auditoria", "notificacoes",
              "usuarios", "triagem"):
        print("  %-14s %5d" % (k, len(saida[k])))
    print("  %-14s %5d linhas / %d meses" % ("relatorios",
          len(saida["relatorios"]["linhas"]), len(saida["relatorios"]["meses"])))
    print("  %-14s %5d bloqueios, %d avisos" % ("fechamento",
          saida["fechamento"]["bloqueios"], saida["fechamento"]["avisos"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
