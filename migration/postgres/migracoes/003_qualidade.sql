-- Migração 003_qualidade — documentos das ferramentas da qualidade
--
-- Escrita à mão (não gerada): leva a tabela nova a um banco onde o 001 já
-- rodou. Num banco criado a partir do schema.sql regenerado, a tabela já vem
-- do 001 e aqui vira quase no-op — só registra a versão.
--
-- Rodar no servidor, depois do 001:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 003_qualidade.sql
--
-- Um registro por documento (5W2H, Ishikawa, SWOT, Kanban), escopo por
-- empresa. O corpo de cada ferramenta fica em `conteudo` (jsonb), porque o
-- formato difere entre elas e evolui na tela; título, tipo e datas ficam em
-- colunas para listar e ordenar sem abrir o jsonb.

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL search_path TO painel;

CREATE TABLE IF NOT EXISTS qualidade_docs (
    id             text PRIMARY KEY,
    empresa        text NOT NULL,
    tipo           text NOT NULL,
    titulo         text NOT NULL DEFAULT '',
    criado_em      date NOT NULL DEFAULT current_date,
    conteudo       jsonb NOT NULL DEFAULT '{}'::jsonb,
    atualizado_em  timestamptz NOT NULL DEFAULT now(),
    atualizado_por text NOT NULL DEFAULT ''
);

-- Só as quatro ferramentas conhecidas.
DO $c1$ BEGIN
    ALTER TABLE qualidade_docs ADD CONSTRAINT qualidade_tipo_valido
        CHECK (tipo IN ('w2h', 'ishikawa', 'swot', 'kanban'));
EXCEPTION WHEN duplicate_object THEN NULL; END $c1$;

-- A listagem sempre filtra por empresa+tipo e mostra o mais novo primeiro.
CREATE INDEX IF NOT EXISTS qualidade_docs_empresa_tipo
    ON qualidade_docs (empresa, tipo, criado_em DESC, id);

INSERT INTO painel.migracoes (versao) VALUES ('003_qualidade')
ON CONFLICT (versao) DO NOTHING;

COMMIT;

-- Conferência:
--   \d painel.qualidade_docs
--   SELECT * FROM painel.migracoes;
