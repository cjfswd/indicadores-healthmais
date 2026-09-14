-- Migração 004_triagem — decisões de triagem da Fase 2
--
-- Escrita à mão (não gerada): leva a tabela nova a um banco onde o 001 já
-- rodou. Num banco criado a partir do schema.sql regenerado, a tabela já vem
-- do 001 e aqui vira quase no-op — só registra a versão.
--
-- Rodar no servidor, depois do 001:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 004_triagem.sql
--
-- Por que existe: a página de Migração decide para qual categoria do catálogo
-- novo vai cada registro cujo rótulo antigo cobre mais de uma. Até aqui essa
-- decisão morava só no `localStorage` de quem decidiu (chave
-- "triagem-cards-v1") — por navegador, por máquina, invisível para o resto da
-- equipe e perdida ao limpar os dados do site. A carga do Postgres nunca a
-- enxergou, então o trabalho de triagem não chegava ao banco.
--
-- A chave é a LINHA da tela, não o evento. Um óbito aparece no card do
-- desfecho e espelhado no card 03, e cada aparição recebe a sua decisão. Por
-- isso `chave` = evento_id, ou evento_id || '@' || card no espelho — o mesmo
-- id de linha que o painel usa em `decisoes`.

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL search_path TO painel;

CREATE TABLE IF NOT EXISTS triagem_decisoes (
    chave        text PRIMARY KEY,
    -- FK: decisão sobre evento que não existe mais é lixo, não histórico.
    evento_id    text NOT NULL REFERENCES patient_events(id) ON DELETE CASCADE,
    -- Preenchido só na linha espelho; NULL na decisão do próprio evento.
    card         text,
    codigo       text NOT NULL,
    decidido_por text NOT NULL DEFAULT '',
    decidido_em  timestamptz NOT NULL DEFAULT now()
);

-- A chave não pode divergir das colunas que ela concatena: sem isto dá para
-- gravar chave 'X@03' apontando para o evento Y, e a tela leria a decisão de
-- outro registro.
DO $c1$ BEGIN
    ALTER TABLE triagem_decisoes ADD CONSTRAINT triagem_chave_coerente
        CHECK (chave = evento_id || COALESCE('@' || card, ''));
EXCEPTION WHEN duplicate_object THEN NULL; END $c1$;

-- Código do catálogo novo: '1.2', '9.1'. Alfanumérico depois do ponto porque
-- a Ouvidoria usa '9.NPS'.
DO $c2$ BEGIN
    ALTER TABLE triagem_decisoes ADD CONSTRAINT triagem_codigo_valido
        CHECK (codigo ~ '^[0-9]{1,2}\.[A-Za-z0-9]{1,4}$');
EXCEPTION WHEN duplicate_object THEN NULL; END $c2$;

-- A leitura mais comum é "as decisões deste evento" (o próprio e o espelho).
CREATE INDEX IF NOT EXISTS triagem_decisoes_evento
    ON triagem_decisoes (evento_id);

INSERT INTO painel.migracoes (versao) VALUES ('004_triagem')
ON CONFLICT (versao) DO NOTHING;

COMMIT;

-- Conferência:
--   \d painel.triagem_decisoes
--   SELECT codigo, count(*) FROM painel.triagem_decisoes GROUP BY 1 ORDER BY 1;
