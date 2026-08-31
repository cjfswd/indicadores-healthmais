-- Migração 001_base — painel de indicadores
--
-- GERADO por gerar_migracao.py a partir de schema.sql, schema_migracao.sql.
-- Não edite aqui: edite os schemas e gere de novo, senão os dois divergem.
--
-- Rodar no servidor:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 001_base.sql
--
-- Seguro num banco que já está em uso:
--   * cria e usa o schema `painel`; não escreve em `public`
--   * roda dentro de uma transação: falhou no meio, não fica meia migração
--   * idempotente: rodar de novo não quebra nem duplica
--   * ON_ERROR_STOP=1 é importante — sem ele o psql segue após erro

\set ON_ERROR_STOP on

BEGIN;

CREATE SCHEMA IF NOT EXISTS painel;

-- O search_path vale só para esta sessão: não altera o padrão do banco nem
-- afeta quem mais estiver conectado.
SET LOCAL search_path TO painel;

-- Controle do que já foi aplicado. Primeira coisa a existir, para que uma
-- migração futura consiga consultar antes de decidir o que fazer.
CREATE TABLE IF NOT EXISTS painel.migracoes (
    versao      text PRIMARY KEY,
    aplicada_em timestamptz NOT NULL DEFAULT now(),
    por         text NOT NULL DEFAULT current_user
);

-- ══ de schema.sql ══

-- Schema Postgres derivado do export real do MongoDB (2026-08-28).
--
-- Decisoes que vieram dos dados, nao de suposicao:
--   * events_store.data continua jsonb: carrega operadores mongo ($push/$set)
--     e payloads de formato variavel. Normalizar isso quebraria o replay.
--   * patients.events (array aninhado) vira tabela propria. E o ganho central
--     da migracao: elimina a corrida de indice descrita em docs/DEPLOY.md,
--     onde um $set por posicao podia escrever no evento errado.
--   * Eventos referenciam indicador/subindicador por NOME (o snapshot embutido
--     nao tem _id do indicador). O import resolve o nome para a FK.
--   * Nenhum paciente tem anexo (file nulo nos 142), entao nao ha bytea aqui.
--     Se voltar a existir, o campo entra como bytea ou referencia externa.

-- Registro digitado hoje e registro que veio do Mongo nao podem ter a mesma
-- exigencia: 126 dos 206 eventos do dump nao tem observacao, e 133 dos 142
-- pacientes nao tem data de admissao. Marcar a origem permite ser estrito com
-- o dado novo sem falsificar o velho -- e o mesmo recurso que
-- docs/novo-modelo/README.md propoe.
DO $tipo$ BEGIN
    CREATE TYPE origem_registro AS ENUM ('sistema', 'legado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $tipo$;


CREATE TABLE IF NOT EXISTS operators (
    id          char(24) PRIMARY KEY,
    -- UNIQUE porque a tela ja recusa nome repetido. Sem isto a regra valeria
    -- so para quem usa o formulario, e um INSERT pelo psql criaria a segunda
    -- "Unimed" sem reclamar.
    name        text NOT NULL UNIQUE,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz
);

CREATE TABLE IF NOT EXISTS users (
    id          char(24) PRIMARY KEY,
    name        text NOT NULL,
    email       text NOT NULL UNIQUE,
    avatar      text,
    created_at  timestamptz,
    deleted_at  timestamptz
);

-- Quem atendeu ou lancou o registro. Nao e a mesma coisa que `users`: usuario
-- e conta de acesso, e quem atende nem sempre tem uma. O formulario cria o
-- nome na hora, entao a tabela precisa existir antes do evento apontar para
-- ela.
CREATE TABLE IF NOT EXISTS profissionais (
    id        bigserial PRIMARY KEY,
    nome      text NOT NULL UNIQUE,
    email     text,
    -- Quem foi criado pelo formulario nao tem conta; quem veio da equipe tem.
    user_id   char(24) REFERENCES users(id),
    ativo     boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS indicators (
    id                  char(24) PRIMARY KEY,
    -- UNIQUE porque o evento resolve o indicador por nome; sem isso o vinculo
    -- fica ambiguo no dia em que dois indicadores repetirem o nome.
    name                text NOT NULL UNIQUE,
    target_type         text,
    target_direction    text,
    target_value        numeric,
    comparison_interval text,
    observations        text,
    created_at          timestamptz,
    updated_at          timestamptz,
    deleted_at          timestamptz
);

CREATE TABLE IF NOT EXISTS subindicators (
    -- Os subindicadores nao tem _id no Mongo: a chave aqui e sintetica.
    id               bigserial PRIMARY KEY,
    indicator_id     char(24) NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    position         int NOT NULL,
    name             text NOT NULL,
    target_type      text,
    target_direction text,
    target_value     numeric,
    UNIQUE (indicator_id, name),
    UNIQUE (indicator_id, position)
);

CREATE TABLE IF NOT EXISTS patients (
    id                  char(24) PRIMARY KEY,
    name                text NOT NULL,
    -- Preenchidas em 3 e 9 dos 142 registros; string vazia vira NULL no import.
    birth_date          date,
    admission_date      date,
    observations        text,
    -- NOT NULL: paciente sem operatorId no Mongo e particular, e a operadora
    -- "Particular" ja existe. Nenhuma categoria sintetica e criada.
    operator_id         char(24) NOT NULL REFERENCES operators(id),
    inactive            boolean NOT NULL DEFAULT false,
    inactivated_at      timestamptz,
    inactivation_reason text,
    updated_by          text,
    origem_registro     origem_registro NOT NULL DEFAULT 'sistema',
    created_at          timestamptz,
    updated_at          timestamptz,
    deleted_at          timestamptz,

    -- A tela fala "ativo | inativo | excluido"; o banco guarda duas flags.
    -- Em vez de uma camada de traducao, ou de uma coluna que alguem preenche
    -- e pode divergir das flags, o proprio banco deriva. Uma fonte de verdade
    -- so, e a aplicacao le em portugues sem converter nada.
    -- text, nao enum: converter text para enum e STABLE, e coluna gerada exige
    -- IMMUTABLE -- o Postgres recusa com "generation expression is not
    -- immutable". Os tres valores ja sao garantidos pela propria expressao,
    -- entao o enum nao acrescentaria garantia, so a dor de alterar tipo.
    situacao text GENERATED ALWAYS AS (
        CASE WHEN deleted_at IS NOT NULL THEN 'excluido'
             WHEN inactive THEN 'inativo'
             ELSE 'ativo' END) STORED,

    -- Data de admissao e obrigatoria no registro novo: sem ela nao ha
    -- episodio de cuidado. 133 dos 142 do dump nao tem, e entram como legado.
    CONSTRAINT admissao_no_registro_novo CHECK (
        origem_registro = 'legado' OR admission_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_patients_situacao ON patients (situacao);

CREATE TABLE IF NOT EXISTS patient_events (
    id              text PRIMARY KEY,
    patient_id      char(24) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    indicator_id    char(24) NOT NULL REFERENCES indicators(id),
    subindicator_id bigint REFERENCES subindicators(id),
    occurrence_date date NOT NULL,
    observations    text,
    assistance_type text,
    -- Quem lancou. O ator do event store vem do login; este e o profissional
    -- responsavel, que pode ser outra pessoa.
    profissional_id bigint REFERENCES profissionais(id),
    origem_registro origem_registro NOT NULL DEFAULT 'sistema',
    position        int NOT NULL,
    UNIQUE (patient_id, position),

    -- A tela exige observacao e responsavel. A regra tem que valer no banco
    -- tambem, senao vale so para quem usa o formulario. O legado escapa por
    -- origem_registro: 126 dos 206 eventos do dump nao tem observacao, e
    -- inventar uma seria pior do que admitir que nao existe.
    CONSTRAINT observacao_no_registro_novo CHECK (
        origem_registro = 'legado' OR nullif(btrim(observations), '') IS NOT NULL),
    CONSTRAINT responsavel_no_registro_novo CHECK (
        origem_registro = 'legado' OR profissional_id IS NOT NULL)
);

-- Anexo em tabela propria, nao em coluna do evento: o conteudo chega a 5 MB, e
-- em coluna todo SELECT do evento arrastaria isso junto mesmo sem precisar.
CREATE TABLE IF NOT EXISTS anexos (
    id            bigserial PRIMARY KEY,
    evento_id     text NOT NULL REFERENCES patient_events(id) ON DELETE CASCADE,
    nome          text NOT NULL,
    tipo          text,                      -- MIME declarado no upload
    tamanho       int NOT NULL,
    conteudo      bytea NOT NULL,
    enviado_por   bigint REFERENCES profissionais(id),
    enviado_em    timestamptz NOT NULL DEFAULT now(),

    -- O teto de 5 MB e o mesmo da tela e o que o sistema atual ja descreve.
    -- No banco tambem, senao um upload por outra via passa.
    CONSTRAINT anexo_ate_5mb CHECK (octet_length(conteudo) <= 5242880),
    -- tamanho e o que o cliente informou; conteudo e o que chegou. Divergir
    -- significa upload truncado.
    CONSTRAINT tamanho_confere CHECK (tamanho = octet_length(conteudo))
);

CREATE INDEX IF NOT EXISTS idx_anexos_evento ON anexos (evento_id);

CREATE TABLE IF NOT EXISTS notifications (
    id         char(24) PRIMARY KEY,
    title      text,
    message    text,
    link       text,
    type       text,
    is_read    boolean NOT NULL DEFAULT false,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS events_store (
    id          char(24) PRIMARY KEY,
    stream_id   text NOT NULL,
    stream_type text NOT NULL,
    event_type  text NOT NULL,
    version     int NOT NULL,
    data        jsonb,
    actor       text,
    "timestamp" timestamptz NOT NULL,
    -- Espelha o indice unico de core/database.py.
    UNIQUE (stream_id, stream_type, version)
);

-- Nao existe collection exportada com este nome: as linhas sao materializadas
-- pelo replay dos 6 eventos de streamType 'social_assistance_reports' no event
-- store (3 CREATE + 3 UPDATE, 3 entidades).
CREATE TABLE IF NOT EXISTS social_assistance_reports (
    id                  char(24) PRIMARY KEY,
    patient_name_raw    text,
    linked_patient_id   char(24) REFERENCES patients(id),
    linked_patient_name text,
    linked_at           timestamptz,
    occurrence_date     date,
    indicator_id        char(24) REFERENCES indicators(id),
    subindicator_id     bigint REFERENCES subindicators(id),
    reporter_name       text,
    reporter_contact    text,
    observations        text,
    status              text,
    updated_by          text
);

CREATE INDEX IF NOT EXISTS idx_events_store_type_ts ON events_store (stream_type, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_sar_linked_patient ON social_assistance_reports (linked_patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_events_patient ON patient_events (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_events_occurrence ON patient_events (occurrence_date);
CREATE INDEX IF NOT EXISTS idx_patients_operator ON patients (operator_id);

-- ══ de schema_migracao.sql ══

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

DO $tipo$ BEGIN
    CREATE TYPE migracao_classe AS ENUM ('direto', 'derivacao', 'ambiguo', 'sem_regra');
EXCEPTION WHEN duplicate_object THEN NULL;
END $tipo$;
DO $tipo$ BEGIN
    CREATE TYPE migracao_status AS ENUM ('pendente', 'decidido', 'aplicado', 'descartado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $tipo$;

-- ─── Lote ────────────────────────────────────────────────────────
-- Uma linha por execucao do loader. Sem isto, duas importacoes do mesmo dump
-- se confundem e nao ha como saber qual carga produziu qual linha.
CREATE TABLE IF NOT EXISTS migracao_lote (
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
CREATE TABLE IF NOT EXISTS migracao_evento (
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

CREATE INDEX IF NOT EXISTS idx_mig_evento_status ON migracao_evento (status);
CREATE INDEX IF NOT EXISTS idx_mig_evento_classe ON migracao_evento (classe, confianca);
CREATE INDEX IF NOT EXISTS idx_mig_evento_paciente ON migracao_evento (paciente_legacy_id);
-- Reimportar procura por legacy_id em qualquer lote.
CREATE INDEX IF NOT EXISTS idx_mig_evento_legacy ON migracao_evento (legacy_id);

-- ─── Trilha ──────────────────────────────────────────────────────
-- Append-only. Cada decisao, cada aplicacao, cada reversao vira uma linha.
-- `de`/`para` guardam o valor anterior e o novo, para a pergunta "quem mudou
-- isto, quando e do que para o que" ter resposta sem replay.
CREATE TABLE IF NOT EXISTS migracao_log (
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

CREATE INDEX IF NOT EXISTS idx_mig_log_evento ON migracao_log (evento_id, quando DESC);
CREATE INDEX IF NOT EXISTS idx_mig_log_lote ON migracao_log (lote_id, quando DESC);

-- ─── Trilha automatica ───────────────────────────────────────────
-- A trilha nao pode depender de a aplicacao lembrar de gravar. O trigger
-- registra decisao e aplicacao mesmo quando a alteracao vem de um UPDATE
-- manual no psql.
CREATE OR REPLACE FUNCTION migracao_registrar() RETURNS trigger AS $$
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

DROP TRIGGER IF EXISTS trg_migracao_registrar ON migracao_evento;
CREATE TRIGGER trg_migracao_registrar
    AFTER INSERT OR UPDATE ON migracao_evento
    FOR EACH ROW EXECUTE FUNCTION migracao_registrar();

-- ─── Leitura ─────────────────────────────────────────────────────
-- O que a tela de Migracao consome, e o que o loader consulta para saber o
-- que ja pode mover.
CREATE OR REPLACE VIEW migracao_pendente AS
SELECT e.*,
       (e.decisao IS NOT NULL) AS decidido,
       coalesce(e.decisao, e.destino_sugerido) AS destino_efetivo
FROM migracao_evento e
WHERE e.status IN ('pendente', 'decidido');

CREATE OR REPLACE VIEW migracao_resumo AS
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

INSERT INTO painel.migracoes (versao) VALUES ('001_base')
ON CONFLICT (versao) DO NOTHING;

COMMIT;

-- Conferência rápida depois de aplicar:
--   SELECT * FROM painel.migracoes;
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'painel';
