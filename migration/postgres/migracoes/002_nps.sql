-- Migração 002_nps — classe da Ouvidoria e instrumento NPS
--
-- Escrita à mão (não gerada): o 001_base é a primeira aplicação e o
-- CREATE TABLE IF NOT EXISTS não adiciona coluna a tabela que já existe. Esta
-- migração leva as colunas novas a um banco onde o 001 já rodou.
--
-- Rodar no servidor, depois do 001:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 002_nps.sql
--
-- Idempotente: ADD COLUMN IF NOT EXISTS, e os CHECK entram capturando o erro
-- de já existir. Rodar de novo não quebra. Num banco criado a partir do 001
-- regenerado (que já traz as colunas), esta migração vira quase toda no-op e
-- só registra a versão.

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL search_path TO painel;

-- As duas colunas. Só a Ouvidoria as usa; nos demais cards ficam NULL.
ALTER TABLE patient_events ADD COLUMN IF NOT EXISTS classe text;
ALTER TABLE patient_events ADD COLUMN IF NOT EXISTS nps jsonb;

-- CHECK de classe válida.
DO $c1$ BEGIN
    ALTER TABLE patient_events ADD CONSTRAINT classe_valida
        CHECK (classe IS NULL OR classe IN ('quantitativa', 'qualitativa'));
EXCEPTION WHEN duplicate_object THEN NULL; END $c1$;

-- NPS existe se, e só se, o evento é qualitativo.
DO $c2$ BEGIN
    ALTER TABLE patient_events ADD CONSTRAINT nps_no_qualitativo
        CHECK ((nps IS NULL AND classe IS DISTINCT FROM 'qualitativa')
               OR (nps IS NOT NULL AND classe = 'qualitativa'));
EXCEPTION WHEN duplicate_object THEN NULL; END $c2$;

-- Relaxa a exigência de observação para o NPS qualitativo: seu conteúdo são as
-- respostas estruturadas, e a Q4 (texto livre) é opcional. Recria o CHECK.
DO $c3$ BEGIN
    ALTER TABLE patient_events DROP CONSTRAINT IF EXISTS observacao_no_registro_novo;
    ALTER TABLE patient_events ADD CONSTRAINT observacao_no_registro_novo
        CHECK (origem_registro = 'legado' OR classe = 'qualitativa'
               OR nullif(btrim(observations), '') IS NOT NULL);
END $c3$;

INSERT INTO painel.migracoes (versao) VALUES ('002_nps')
ON CONFLICT (versao) DO NOTHING;

COMMIT;

-- Conferência:
--   \d painel.patient_events   -- deve listar classe e nps
--   SELECT * FROM painel.migracoes;
