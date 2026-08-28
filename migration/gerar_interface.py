"""Monta a interface de decisao dos eventos ambiguos.

    python gerar_interface.py --src <dir-do-export> --out <dir-fora-do-repo>
    python -m http.server 5175 --directory <dir-fora-do-repo>

Copia interface/index.html e grava dados.json ao lado. O JSON CONTEM NOME DE
PACIENTE E OBSERVACAO CLINICA -- por isso a saida vai para fora do repositorio,
e a pagina nunca deve ser publicada: e para rodar em localhost.
"""
import argparse
import json
import shutil
from pathlib import Path

from fase1_inventario import classificar, ler_pacientes

CAMPOS = [
    "evento_id", "paciente_id", "paciente", "data", "subindicador_antigo",
    "indicador_antigo", "observacoes_raw", "pista", "sugestao", "sugestao_nome",
    "confianca", "motivo_sugestao", "opcoes", "destino", "destino_nome", "nota",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    linhas = classificar(ler_pacientes(args.src))
    ambiguos = [
        {k: l.get(k, "") for k in CAMPOS}
        for l in linhas if l["tipo"] in ("ambiguo", "sem_regra")
    ]
    # Sem sugestao primeiro: sao os que exigem mais do revisor.
    ordem = {"nenhuma": 0, "baixa": 1, "media": 2, "alta": 3}
    ambiguos.sort(key=lambda a: (ordem.get(a["confianca"], 9), a["subindicador_antigo"]))

    args.out.mkdir(parents=True, exist_ok=True)
    shutil.copy(Path(__file__).parent / "interface" / "index.html", args.out / "index.html")
    (args.out / "dados.json").write_text(
        json.dumps(ambiguos, ensure_ascii=False, indent=1), encoding="utf-8")

    por_conf = {}
    for a in ambiguos:
        por_conf[a["confianca"]] = por_conf.get(a["confianca"], 0) + 1
    print("interface em %s" % args.out)
    print("  %d casos: %s" % (len(ambiguos), por_conf))
    print("  sirva com: python -m http.server 5175 --directory %s" % args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
