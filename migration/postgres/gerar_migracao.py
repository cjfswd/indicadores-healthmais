# -*- coding: utf-8 -*-
"""Compõe o arquivo de migração para rodar no servidor.

    python gerar_migracao.py [--schema painel] [--out migracoes/001_base.sql]

Os schemas continuam sendo a fonte de verdade; este script os embrulha para
serem seguros num banco que já está de pé:

  * Tudo vai para um schema próprio, não para `public`. O container já tem
    outros bancos e tabelas — misturar seria pedir colisão de nome.
  * Cada objeto vira idempotente (IF NOT EXISTS, OR REPLACE, DROP antes do
    trigger). Rodar duas vezes não quebra e não duplica.
  * Uma tabela de controle registra o que já foi aplicado, com data.

Limite conhecido: `CREATE TABLE IF NOT EXISTS` não adiciona coluna a uma
tabela que já existe. Este arquivo serve para a primeira aplicação; mudança de
coluna depois exige uma migração numerada nova, com ALTER — que é justamente
por que o arquivo nasce numerado.
"""
import argparse
import re
from pathlib import Path

AQUI = Path(__file__).parent
FONTES = ["schema.sql", "schema_migracao.sql"]


def idempotente(sql: str) -> str:
    """Reescreve o DDL para poder rodar de novo sem erro."""
    sql = re.sub(r"\bCREATE TABLE (\w+)", r"CREATE TABLE IF NOT EXISTS \1", sql)
    sql = re.sub(r"\bCREATE INDEX (\w+)", r"CREATE INDEX IF NOT EXISTS \1", sql)
    sql = re.sub(r"\bCREATE VIEW (\w+)", r"CREATE OR REPLACE VIEW \1", sql)
    sql = re.sub(r"\bCREATE FUNCTION (\w+)", r"CREATE OR REPLACE FUNCTION \1", sql)

    # CREATE TYPE nao aceita IF NOT EXISTS; o jeito e capturar a excecao.
    def envolver_tipo(m):
        return ("DO $tipo$ BEGIN\n    %s\nEXCEPTION WHEN duplicate_object THEN NULL;\n"
                "END $tipo$;" % m.group(0).strip())
    sql = re.sub(r"CREATE TYPE \w+ AS ENUM \([^;]*\);", envolver_tipo, sql, flags=re.S)

    # Trigger tambem nao tem OR REPLACE em toda versao: derruba antes.
    def envolver_trigger(m):
        nome, tabela = m.group(1), m.group(2)
        return "DROP TRIGGER IF EXISTS %s ON %s;\n%s" % (nome, tabela, m.group(0))
    sql = re.sub(r"CREATE TRIGGER (\w+)\s*\n?\s*AFTER[^;]*?ON (\w+)[^;]*;",
                 envolver_trigger, sql, flags=re.S)

    # As transacoes de cada arquivo saem: o embrulho abre uma so.
    sql = re.sub(r"^\s*(BEGIN|COMMIT)\s*;\s*$", "", sql, flags=re.M)
    return sql.strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--schema", default="painel", help="schema de destino no banco")
    ap.add_argument("--versao", default="001_base")
    ap.add_argument("--out", type=Path, default=AQUI / "migracoes" / "001_base.sql")
    args = ap.parse_args()

    partes = []
    for nome in FONTES:
        corpo = (AQUI / nome).read_text(encoding="utf-8")
        partes.append("-- ══ de %s ══\n\n%s" % (nome, idempotente(corpo)))

    cabecalho = '''-- Migração %(versao)s — painel de indicadores
--
-- GERADO por gerar_migracao.py a partir de %(fontes)s.
-- Não edite aqui: edite os schemas e gere de novo, senão os dois divergem.
--
-- Rodar no servidor:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f %(versao)s.sql
--
-- Seguro num banco que já está em uso:
--   * cria e usa o schema `%(schema)s`; não escreve em `public`
--   * roda dentro de uma transação: falhou no meio, não fica meia migração
--   * idempotente: rodar de novo não quebra nem duplica
--   * ON_ERROR_STOP=1 é importante — sem ele o psql segue após erro

\\set ON_ERROR_STOP on

BEGIN;

CREATE SCHEMA IF NOT EXISTS %(schema)s;

-- O search_path vale só para esta sessão: não altera o padrão do banco nem
-- afeta quem mais estiver conectado.
SET LOCAL search_path TO %(schema)s;

-- Controle do que já foi aplicado. Primeira coisa a existir, para que uma
-- migração futura consiga consultar antes de decidir o que fazer.
CREATE TABLE IF NOT EXISTS %(schema)s.migracoes (
    versao      text PRIMARY KEY,
    aplicada_em timestamptz NOT NULL DEFAULT now(),
    por         text NOT NULL DEFAULT current_user
);

''' % {"versao": args.versao, "schema": args.schema, "fontes": ", ".join(FONTES)}

    rodape = '''

INSERT INTO %(schema)s.migracoes (versao) VALUES (%(v)s)
ON CONFLICT (versao) DO NOTHING;

COMMIT;

-- Conferência rápida depois de aplicar:
--   SELECT * FROM %(schema)s.migracoes;
--   SELECT table_name FROM information_schema.tables WHERE table_schema = '%(schema)s';
''' % {"schema": args.schema, "v": "'" + args.versao + "'"}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(cabecalho + "\n\n".join(partes) + rodape, encoding="utf-8")

    texto = args.out.read_text(encoding="utf-8")
    print("escrito: %s (%d linhas)" % (args.out, len(texto.splitlines())))
    print("  schema de destino: %s" % args.schema)
    print("  tabelas:  %d" % len(re.findall(r"CREATE TABLE IF NOT EXISTS", texto)))
    print("  indices:  %d" % len(re.findall(r"CREATE INDEX IF NOT EXISTS", texto)))
    print("  tipos:    %d" % len(re.findall(r"DO \$tipo\$", texto)))
    print("  views:    %d" % len(re.findall(r"CREATE OR REPLACE VIEW", texto)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
