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

BEGIN;

CREATE TABLE operators (
    id          char(24) PRIMARY KEY,
    name        text NOT NULL,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz
);

CREATE TABLE users (
    id          char(24) PRIMARY KEY,
    name        text NOT NULL,
    email       text NOT NULL UNIQUE,
    avatar      text,
    created_at  timestamptz,
    deleted_at  timestamptz
);

CREATE TABLE indicators (
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

CREATE TABLE subindicators (
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

CREATE TABLE patients (
    id                  char(24) PRIMARY KEY,
    name                text NOT NULL,
    -- Preenchidas em 3 e 9 dos 142 registros; string vazia vira NULL no import.
    birth_date          date,
    admission_date      date,
    observations        text,
    -- NOT NULL: os 3 pacientes sem operadora no Mongo caem na categoria
    -- sintetica "Sem Operadora", criada pelo import.
    operator_id         char(24) NOT NULL REFERENCES operators(id),
    inactive            boolean NOT NULL DEFAULT false,
    inactivated_at      timestamptz,
    inactivation_reason text,
    updated_by          text,
    created_at          timestamptz,
    updated_at          timestamptz,
    deleted_at          timestamptz
);

CREATE TABLE patient_events (
    id              text PRIMARY KEY,
    patient_id      char(24) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    indicator_id    char(24) NOT NULL REFERENCES indicators(id),
    subindicator_id bigint REFERENCES subindicators(id),
    occurrence_date date NOT NULL,
    observations    text,
    assistance_type text,
    position        int NOT NULL,
    UNIQUE (patient_id, position)
);

CREATE TABLE notifications (
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

CREATE TABLE events_store (
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
CREATE TABLE social_assistance_reports (
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

CREATE INDEX idx_events_store_type_ts ON events_store (stream_type, "timestamp" DESC);
CREATE INDEX idx_sar_linked_patient ON social_assistance_reports (linked_patient_id);
CREATE INDEX idx_patient_events_patient ON patient_events (patient_id);
CREATE INDEX idx_patient_events_occurrence ON patient_events (occurrence_date);
CREATE INDEX idx_patients_operator ON patients (operator_id);

COMMIT;
