-- Fase 3: area de migracao dentro do proprio banco.
--
-- A Fase 2 deixa de ser planilha. Os casos ambiguos viram linhas aqui, os
-- usuarios decidem pela tela, e o loader move o que estiver decidido. Isso
-- muda tres coisas em relacao ao arquivo:
--
--   * A decisao tem dono e data. Planilha nao registra quem escreveu o que.
--   * O loader vira idempotente de graca: `status` diz o que ja foi movido,
--     entao rodar de novo nao duplica nem desfaz.
--   * A trilha fica no mesmo lugar do dado. Se daqui a um ano alguem
--     perguntar por que um evento virou 9.1 e nao 9.2, a resposta esta a um
--     JOIN de distancia, nao num arquivo que se perdeu.
--
-- Estas tabelas sao temporarias por natureza, mas nao descartaveis: sao a
-- prova de como a base nova foi construida. Nao as derrube depois do corte.

BEGIN;

CREATE TYPE migracao_classe AS ENUM ('direto', 'derivacao', 'ambiguo', 'sem_regra');
CREATE TYPE migracao_status AS ENUM ('pendente', 'decidido', 'aplicado', 'descartado');

-- ─── Lote ────────────────────────────────────────────────────────
-- Uma linha por execucao do loader. Sem isto, duas importacoes do mesmo dump
-- se confundem e nao ha como saber qual carga produziu qual linha.
CREATE TABLE migracao_lote (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fonte         text NOT NULL,              -- diretorio ou identificacao do dump
    dump_gerado_em date NOT NULL,             -- data do export, nao a da importacao
    iniciado_em   timestamptz NOT NULL DEFAULT now(),
    concluido_em  timestamptz,
    eventos       int NOT NULL DEFAULT 0,
    observacoes   text,
    -- Dois lotes do mesmo dump sao quase sempre engano; se for proposital,
    -- diferencie pela fonte.
    UNIQUE (fonte, dump_gerado_em)
);

-- ─── Evento em migracao ──────────────────────────────────────────
CREATE TABLE migracao_evento (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lote_id           bigint NOT NULL REFERENCES migracao_lote(id) ON DELETE CASCADE,

    -- Chave do Mongo. E o que torna a carga idempotente: reimportar o mesmo
    -- dump encontra a linha em vez de criar outra.
    legacy_id         text NOT NULL,
    paciente_legacy_id char(24) NOT NULL,
    paciente_nome     text NOT NULL,          -- copia: o cadastro pode mudar depois

    -- Como estava no sistema antigo
    indicador_antigo    text NOT NULL,
    subindicador_antigo text,
    ocorrencia_em       date,
    observacoes         text,
    assistencia         text,

    -- O que o inventario da Fase 1 concluiu
    classe            migracao_classe NOT NULL,
    destino_sugerido  text,
    confianca         text,                   -- alta | media | baixa | nenhuma
    motivo_sugestao   text,
    pista             text,
    opcoes            text[] NOT NULL DEFAULT '{}',
    nota              text,

    -- O que a pessoa decidiu
    decisao      text,
    decidido_por text,
    decidido_em  timestamptz,

    -- Para onde foi, depois de aplicado
    status         migracao_status NOT NULL DEFAULT 'pendente',
    destino_tabela text,
    destino_id     bigint,
    aplicado_em    timestamptz,

    UNIQUE (lote_id, legacy_id),

    -- Decisao e autor andam juntos: decisao anonima nao serve de trilha.
    CONSTRAINT decisao_com_autor CHECK (
        (decisao IS NULL AND decidido_por IS NULL AND decidido_em IS NULL)
        OR (decisao IS NOT NULL AND decidido_por IS NOT NULL AND decidido_em IS NOT NULL)),

    -- So se aplica o que tem destino. Para 'direto' e 'derivacao' o destino
    -- vem do de-para; para 'ambiguo', da decisao.
    CONSTRAINT aplicado_tem_destino CHECK (
        status <> 'aplicado'
        OR (destino_tabela IS NOT NULL AND aplicado_em IS NOT NULL)),

    -- Ambiguo so sai de pendente com decisao registrada.
    CONSTRAINT ambiguo_exige_decisao CHECK (
        classe <> 'ambiguo' OR status = 'pendente' OR status = 'descartado'
        OR decisao IS NOT NULL)
);

CREATE INDEX idx_mig_evento_status ON migracao_evento (status);
CREATE INDEX idx_mig_evento_classe ON migracao_evento (classe, confianca);
CREATE INDEX idx_mig_evento_paciente ON migracao_evento (paciente_legacy_id);
-- Reimportar procura por legacy_id em qualquer lote.
CREATE INDEX idx_mig_evento_legacy ON migracao_evento (legacy_id);

-- ─── Trilha ──────────────────────────────────────────────────────
-- Append-only. Cada decisao, cada aplicacao, cada reversao vira uma linha.
-- `de`/`para` guardam o valor anterior e o novo, para a pergunta "quem mudou
-- isto, quando e do que para o que" ter resposta sem replay.
CREATE TABLE migracao_log (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lote_id     bigint REFERENCES migracao_lote(id) ON DELETE CASCADE,
    evento_id   bigint REFERENCES migracao_evento(id) ON DELETE CASCADE,
    quando      timestamptz NOT NULL DEFAULT now(),
    ator        text NOT NULL,
    acao        text NOT NULL,   -- importado | decidido | aplicado | revertido | descartado
    de          jsonb,
    para        jsonb,
    detalhe     text
);

CREATE INDEX idx_mig_log_evento ON migracao_log (evento_id, quando DESC);
CREATE INDEX idx_mig_log_lote ON migracao_log (lote_id, quando DESC);

-- ─── Trilha automatica ───────────────────────────────────────────
-- A trilha nao pode depender de a aplicacao lembrar de gravar. O trigger
-- registra decisao e aplicacao mesmo quando a alteracao vem de um UPDATE
-- manual no psql.
CREATE FUNCTION migracao_registrar() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO migracao_log (lote_id, evento_id, ator, acao, para, detalhe)
        VALUES (NEW.lote_id, NEW.id, 'loader', 'importado',
                jsonb_build_object('classe', NEW.classe, 'sugestao', NEW.destino_sugerido,
                                   'confianca', NEW.confianca),
                NEW.indicador_antigo || ' / ' || coalesce(NEW.subindicador_antigo, '—'));
        RETURN NEW;
    END IF;

    IF NEW.decisao IS DISTINCT FROM OLD.decisao THEN
        INSERT INTO migracao_log (lote_id, evento_id, ator, acao, de, para, detalhe)
        VALUES (NEW.lote_id, NEW.id, coalesce(NEW.decidido_por, 'desconhecido'), 'decidido',
                jsonb_build_object('decisao', OLD.decisao),
                jsonb_build_object('decisao', NEW.decisao),
                CASE WHEN NEW.decisao = NEW.destino_sugerido
                     THEN 'aceitou a sugestão' ELSE 'divergiu da sugestão' END);
    END IF;

    -- Só o que muda o destino do evento vira linha. pendente -> decidido nao
    -- entra aqui: a decisao ja tem a propria linha acima, e registrar as duas
    -- faria a historia contar o mesmo fato duas vezes.
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NOT (OLD.status = 'pendente' AND NEW.status = 'decidido') THEN
        INSERT INTO migracao_log (lote_id, evento_id, ator, acao, de, para, detalhe)
        VALUES (NEW.lote_id, NEW.id, 'loader',
                CASE NEW.status
                     WHEN 'aplicado' THEN 'aplicado'
                     WHEN 'descartado' THEN 'descartado'
                     -- Sair de aplicado e reversao de verdade; o resto e ajuste.
                     ELSE CASE WHEN OLD.status = 'aplicado' THEN 'revertido' ELSE 'ajustado' END
                END,
                jsonb_build_object('status', OLD.status),
                jsonb_build_object('status', NEW.status,
                                   'tabela', NEW.destino_tabela, 'id', NEW.destino_id),
                NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_migracao_registrar
    AFTER INSERT OR UPDATE ON migracao_evento
    FOR EACH ROW EXECUTE FUNCTION migracao_registrar();

-- ─── Leitura ─────────────────────────────────────────────────────
-- O que a tela de Migracao consome, e o que o loader consulta para saber o
-- que ja pode mover.
CREATE VIEW migracao_pendente AS
SELECT e.*,
       (e.decisao IS NOT NULL) AS decidido,
       coalesce(e.decisao, e.destino_sugerido) AS destino_efetivo
FROM migracao_evento e
WHERE e.status IN ('pendente', 'decidido');

CREATE VIEW migracao_resumo AS
SELECT l.id AS lote_id, l.fonte, l.dump_gerado_em,
       count(*) AS eventos,
       count(*) FILTER (WHERE e.classe = 'direto') AS direto,
       count(*) FILTER (WHERE e.classe = 'derivacao') AS derivacao,
       count(*) FILTER (WHERE e.classe = 'ambiguo') AS ambiguo,
       count(*) FILTER (WHERE e.classe = 'ambiguo' AND e.decisao IS NULL) AS ambiguo_pendente,
       count(*) FILTER (WHERE e.status = 'aplicado') AS aplicado,
       count(*) FILTER (WHERE e.decisao IS NOT NULL
                          AND e.decisao IS DISTINCT FROM e.destino_sugerido) AS divergiu
FROM migracao_lote l
JOIN migracao_evento e ON e.lote_id = l.id
GROUP BY l.id, l.fonte, l.dump_gerado_em;

COMMIT;
