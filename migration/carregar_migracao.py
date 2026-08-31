# -*- coding: utf-8 -*-
"""Fase 3, etapa 1: lê o dump e popula a área de migração no Postgres.

    python carregar_migracao.py --src <dir-do-export> --out carga_migracao.sql

Não há planilha. Os 206 eventos entram em `migracao_evento` já classificados
pelo inventário da Fase 1, com a sugestão e a confiança quando existem. Os
ambíguos ficam `pendente` até alguém decidir pela tela; o resto já nasce com
destino resolvido pelo de-para.

Idempotente: a carga usa `ON CONFLICT (lote_id, legacy_id)` e só atualiza o
que veio do inventário — decisão, autor e status ficam intactos. Reimportar o
mesmo dump depois de as pessoas decidirem não apaga o trabalho delas.

CONTÉM NOME DE PACIENTE E OBSERVAÇÃO CLÍNICA. Grave fora do repositório.
"""
import argparse
import json
from pathlib import Path

from catalogo_novo import CARDS
from fase1_inventario import classificar, ler_pacientes, pista, prefixo
from sugestao import sugerir


def lit(v):
    """Literal SQL. None vira NULL; o resto sai como texto com aspas dobradas."""
    if v is None or v == "":
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def arr(vs):
    """text[] do Postgres."""
    if not vs:
        return "'{}'"
    return "ARRAY[" + ", ".join(lit(v) for v in vs) + "]::text[]"


def montar(src: Path, competencia: str):
    pacientes = ler_pacientes(src)
    linhas = classificar(pacientes)

    # A classificacao ja traz pista e sugestao; aqui so achatamos para SQL.
    saida = []
    for l in linhas:
        opcoes = [o.split()[0] for o in (l["opcoes"] or "").split(" | ") if o.strip()]
        # Direto e derivacao nascem com destino; ambiguo espera decisao.
        sugerido = l["sugestao"] or l["destino"] or None
        saida.append({
            "legacy_id": l["evento_id"],
            "paciente_legacy_id": l["paciente_id"],
            "paciente_nome": l["paciente"],
            "indicador_antigo": l["indicador_antigo"],
            "subindicador_antigo": l["subindicador_antigo"],
            "ocorrencia_em": l["data"] or None,
            "observacoes": l["observacoes_raw"] or None,
            "assistencia": l["assistencia"] or None,
            "classe": l["tipo"] if l["tipo"] != "sem_regra" else "sem_regra",
            "destino_sugerido": sugerido,
            "confianca": l["confianca"] or None,
            "motivo_sugestao": l["motivo_sugestao"] or None,
            "pista": l["pista"] or None,
            "opcoes": opcoes,
            "nota": l["nota"] or None,
        })
    return saida


def emitir(eventos, destino: Path, fonte: str, gerado: str):
    with destino.open("w", encoding="utf-8") as fh:
        fh.write("-- Carga da area de migracao. Rodar depois de schema_migracao.sql.\n")
        fh.write("-- Reimportar e seguro: nao mexe em decisao nem em status.\n\n")
        fh.write("BEGIN;\n\n")

        fh.write("INSERT INTO migracao_lote (fonte, dump_gerado_em, eventos, observacoes)\n"
                 "VALUES (%s, %s, %d, 'carga automatica pelo carregar_migracao.py')\n"
                 "ON CONFLICT (fonte, dump_gerado_em) DO UPDATE SET eventos = EXCLUDED.eventos;\n\n"
                 % (lit(fonte), lit(gerado), len(eventos)))

        # DROP antes: a temp table sobrevive à sessão, e reimportar na mesma
        # conexão esbarraria em "relation already exists".
        fh.write("DROP TABLE IF EXISTS _lote;\n"
                 "CREATE TEMP TABLE _lote AS\n"
                 "  SELECT id FROM migracao_lote WHERE fonte = %s AND dump_gerado_em = %s;\n\n"
                 % (lit(fonte), lit(gerado)))

        campos = ("lote_id, legacy_id, paciente_legacy_id, paciente_nome, indicador_antigo, "
                  "subindicador_antigo, ocorrencia_em, observacoes, assistencia, classe, "
                  "destino_sugerido, confianca, motivo_sugestao, pista, opcoes, nota")

        for e in eventos:
            valores = ", ".join([
                "(SELECT id FROM _lote)",
                lit(e["legacy_id"]), lit(e["paciente_legacy_id"]), lit(e["paciente_nome"]),
                lit(e["indicador_antigo"]), lit(e["subindicador_antigo"]),
                lit(e["ocorrencia_em"]) + "::date" if e["ocorrencia_em"] else "NULL",
                lit(e["observacoes"]), lit(e["assistencia"]),
                lit(e["classe"]) + "::migracao_classe",
                lit(e["destino_sugerido"]), lit(e["confianca"]), lit(e["motivo_sugestao"]),
                lit(e["pista"]), arr(e["opcoes"]), lit(e["nota"]),
            ])
            fh.write("INSERT INTO migracao_evento (%s)\nVALUES (%s)\n"
                     "ON CONFLICT (lote_id, legacy_id) DO UPDATE SET\n"
                     "  classe = EXCLUDED.classe,\n"
                     "  destino_sugerido = EXCLUDED.destino_sugerido,\n"
                     "  confianca = EXCLUDED.confianca,\n"
                     "  motivo_sugestao = EXCLUDED.motivo_sugestao,\n"
                     "  pista = EXCLUDED.pista,\n"
                     "  opcoes = EXCLUDED.opcoes,\n"
                     "  nota = EXCLUDED.nota;\n\n" % (campos, valores))

        fh.write("COMMIT;\n")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--gerado", default="2026-08-28", help="data do dump")
    args = ap.parse_args()

    eventos = montar(args.src, args.gerado)
    emitir(eventos, args.out, args.src.name, args.gerado)

    por_classe = {}
    pendentes = 0
    for e in eventos:
        por_classe[e["classe"]] = por_classe.get(e["classe"], 0) + 1
        if e["classe"] == "ambiguo":
            pendentes += 1
    print("escrito: %s" % args.out)
    print("  eventos            %4d" % len(eventos))
    for k in ("direto", "derivacao", "ambiguo", "sem_regra"):
        if por_classe.get(k):
            print("  %-18s %4d" % (k, por_classe[k]))
    print("  aguardam decisao   %4d" % pendentes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
