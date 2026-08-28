"""Fase 1 do plano de corte: inventario do dump contra a recategorizacao.

    python fase1_inventario.py --src <dir-do-export> --out <dir-de-saida>

Produz:
  de-para.csv    equivalencia antigo -> novo, com contagem real de eventos
  ambiguos.csv   um evento por linha, com coluna DECISAO em branco -- e a
                 planilha da Fase 2, para revisao de quem conhece os casos
  card06.csv     derivacao dos eventos de AD/ID em modalidade de episodio

Nada aqui grava em banco. E leitura do dump e classificacao.
"""
import argparse
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

from catalogo_novo import CARDS, DE_PARA
from sugestao import sugerir

# Os nomes antigos tem seta ('5.1 - ^ PAD') e acento; o console do Windows e cp1252.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def prefixo(nome: str) -> str:
    """'01 - Indicador de Fluxo' -> '01'; '1.1 - Alta Domiciliar' -> '1.1'."""
    m = re.match(r"\s*(\d+(?:\.\d+)?)", nome or "")
    return m.group(1) if m else ""


def ler_pacientes(src: Path) -> list:
    arq = src / "patients.json"
    with arq.open(encoding="utf-8") as fh:
        return [json.loads(l) for l in fh if l.strip()]


def nome_novo(codigo: str) -> str:
    if not codigo or codigo == "EM_TRIAGEM":
        return "em triagem" if codigo else ""
    card = codigo.split(".")[0].zfill(2)
    return CARDS.get(card, ("", {}, ""))[1].get(codigo, "")


def _data(s):
    try:
        return date.fromisoformat((s or "").strip())
    except ValueError:
        return None


def pista(paciente: dict, evento: dict, pi: str, ps: str) -> str:
    """Evidencia cruzada para o revisor -- NAO e decisao automatica.

    O README do novo-modelo e explicito: com esse volume, a resolucao dos
    ambiguos e revisao humana, nao inferencia. Estas colunas existem para o
    revisor nao abrir o prontuario a cada linha; a decisao continua dele.
    """
    if pi == "02" and ps == "2.2":
        dt = _data(evento.get("occurrenceDate"))
        internacoes = [
            _data(e.get("occurrenceDate")) for e in (paciente.get("events") or [])
            if prefixo((e.get("indicator") or {}).get("name", "")) == "03"
        ]
        perto = [x for x in internacoes if x and dt and abs((x - dt).days) <= 2]
        if perto:
            return "internação (card 03) registrada em ±2 dias → sugere 2.4"
        return "nenhuma internação próxima registrada → sugere 2.3"

    if pi == "01" and ps == "1.1":
        if paciente.get("inactive"):
            return "paciente inativado → alta encerrou o cuidado, sugere 1.2"
        if paciente.get("deletedAt"):
            return "paciente excluído → alta encerrou o cuidado, sugere 1.2"
        return "paciente segue ativo → cuidado continuou, sugere 1.3 (transição)"

    if pi == "04":
        if not (paciente.get("admissionDate") or "").strip():
            return "sem data de admissão: o tempo até o óbito não é recuperável"
        return "tempo até o óbito vira campo, não categoria; expectativa é desconhecida"

    return ""


def classificar(pacientes: list):
    """Percorre os eventos e aplica o de-para. Devolve (linhas, contagens)."""
    linhas = []
    for p in pacientes:
        pid = str((p.get("_id") or {}).get("$oid") or p.get("_id") or "")
        for ev in (p.get("events") or []):
            ind = (ev.get("indicator") or {}).get("name", "")
            sub = (ev.get("subindicator") or {}).get("name", "")
            pi, ps = prefixo(ind), prefixo(sub)

            regra = DE_PARA.get((pi, ps)) or DE_PARA.get((pi, None))
            if regra is None:
                regra = ("sem_regra", None, [], "Nenhuma regra cobre esta combinação.")
            tipo, destino, opcoes, nota = regra

            obs = (ev.get("observations") or "").strip()
            dica = pista(p, ev, pi, ps)
            if tipo in ("ambiguo", "sem_regra"):
                sug, conf, motivo_sug = sugerir(pi, ps, obs, dica, opcoes)
            else:
                sug, conf, motivo_sug = "", "", ""

            linhas.append({
                "evento_id": ev.get("_id", ""),
                "paciente_id": pid,
                "paciente": p.get("name", ""),
                "data": ev.get("occurrenceDate", ""),
                "indicador_antigo": ind,
                "subindicador_antigo": sub,
                "prefixo_antigo": (pi + "/" + ps) if ps else pi,
                "tipo": tipo,
                "destino": destino or "",
                "destino_nome": nome_novo(destino),
                "opcoes": " | ".join("%s %s" % (o, nome_novo(o)) for o in opcoes),
                "nota": nota,
                "pista": dica,
                "sugestao": sug or "",
                "sugestao_nome": nome_novo(sug) if sug else "",
                "confianca": conf,
                "motivo_sugestao": motivo_sug,
                "observacoes": obs.replace("\n", " "),
                "observacoes_raw": obs,
                "assistencia": ev.get("assistanceType") or "",
            })
    return linhas


def relatorio(linhas: list) -> None:
    total = len(linhas)
    por_tipo = Counter(l["tipo"] for l in linhas)
    print("eventos no dump: %d" % total)
    print("")
    for tipo in ("direto", "derivacao", "ambiguo", "sem_regra"):
        n = por_tipo.get(tipo, 0)
        if n:
            print("  %-10s %4d  (%4.1f%%)" % (tipo, n, 100 * n / total))
    print("")

    print("de-para por origem:")
    agrupado = defaultdict(lambda: [0, None])
    for l in linhas:
        chave = (l["prefixo_antigo"], l["subindicador_antigo"] or l["indicador_antigo"])
        agrupado[chave][0] += 1
        agrupado[chave][1] = l
    for (pref, rotulo), (n, exemplo) in sorted(agrupado.items()):
        alvo = exemplo["destino"] or ("[%s]" % "/".join(
            o.split()[0] for o in exemplo["opcoes"].split(" | ") if o) or "?")
        print("  %-9s %-42s %4d  %-9s -> %s" % (
            pref, rotulo[:42], n, exemplo["tipo"], alvo))


def derivacao_card06(pacientes: list) -> list:
    """Card 06 nao vira fato: o ultimo evento por paciente e a modalidade atual."""
    saida = []
    for p in pacientes:
        pid = str((p.get("_id") or {}).get("$oid") or p.get("_id") or "")
        eventos = [
            ev for ev in (p.get("events") or [])
            if prefixo((ev.get("indicator") or {}).get("name", "")) == "06"
        ]
        if not eventos:
            continue
        eventos.sort(key=lambda e: e.get("occurrenceDate") or "")
        for i, ev in enumerate(eventos):
            sub = (ev.get("subindicator") or {}).get("name", "")
            modalidade = "ID" if "ID (" in sub or sub.strip().startswith("6.2") else "AD"
            ultimo = i == len(eventos) - 1
            saida.append({
                "paciente_id": pid,
                "paciente": p.get("name", ""),
                "data": ev.get("occurrenceDate", ""),
                "subindicador_antigo": sub,
                "modalidade": modalidade,
                "papel": "estado atual do episódio" if ultimo else "alteração de plano (4.3)",
            })
    return saida


def gravar(linhas: list, destino: Path, campos: list) -> None:
    # utf-8-sig para o Excel abrir com acento correto.
    with destino.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=campos, extrasaction="ignore")
        w.writeheader()
        w.writerows(linhas)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    pacientes = ler_pacientes(args.src)
    linhas = classificar(pacientes)
    relatorio(linhas)

    gravar(linhas, args.out / "de-para.csv", [
        "evento_id", "paciente_id", "data", "indicador_antigo", "subindicador_antigo",
        "prefixo_antigo", "tipo", "destino", "destino_nome", "nota",
    ])

    ambiguos = [l for l in linhas if l["tipo"] in ("ambiguo", "sem_regra")]
    for l in ambiguos:
        l["DECISAO"] = ""
    gravar(ambiguos, args.out / "ambiguos.csv", [
        "evento_id", "paciente_id", "paciente", "data",
        "indicador_antigo", "subindicador_antigo", "observacoes", "assistencia",
        "sugestao", "sugestao_nome", "confianca", "motivo_sugestao",
        "pista", "destino", "opcoes", "nota", "DECISAO",
    ])

    card06 = derivacao_card06(pacientes)
    gravar(card06, args.out / "card06.csv", [
        "paciente_id", "paciente", "data", "subindicador_antigo", "modalidade", "papel",
    ])

    print("")
    print("gravado em %s:" % args.out)
    print("  de-para.csv   %4d linhas" % len(linhas))
    print("  ambiguos.csv  %4d linhas  <- planilha da Fase 2" % len(ambiguos))
    print("  card06.csv    %4d linhas" % len(card06))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
