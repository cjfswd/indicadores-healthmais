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

-- Registro digitado hoje e registro que veio do Mongo nao podem ter a mesma
-- exigencia: 126 dos 206 eventos do dump nao tem observacao, e 133 dos 142
-- pacientes nao tem data de admissao. Marcar a origem permite ser estrito com
-- o dado novo sem falsificar o velho -- e o mesmo recurso que
-- docs/novo-modelo/README.md propoe.
CREATE TYPE origem_registro AS ENUM ('sistema', 'legado');


CREATE TABLE operators (
    id          char(24) PRIMARY KEY,
    -- UNIQUE porque a tela ja recusa nome repetido. Sem isto a regra valeria
    -- so para quem usa o formulario, e um INSERT pelo psql criaria a segunda
    -- "Unimed" sem reclamar.
    name        text NOT NULL UNIQUE,
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

-- Quem atendeu ou lancou o registro. Nao e a mesma coisa que `users`: usuario
-- e conta de acesso, e quem atende nem sempre tem uma. O formulario cria o
-- nome na hora, entao a tabela precisa existir antes do evento apontar para
-- ela.
CREATE TABLE profissionais (
    id        bigserial PRIMARY KEY,
    nome      text NOT NULL UNIQUE,
    email     text,
    -- Quem foi criado pelo formulario nao tem conta; quem veio da equipe tem.
    user_id   char(24) REFERENCES users(id),
    ativo     boolean NOT NULL DEFAULT true,
    criado_em timestamptz NOT NULL DEFAULT now()
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
    -- NOT NULL: paciente sem operatorId no Mongo e particular, e a operadora
    -- "Particular" ja existe. Nenhuma categoria sintetica e criada.
    operator_id         char(24) NOT NULL REFERENCES operators(id),
    inactive            boolean NOT NULL DEFAULT false,
    inactivated_at      timestamptz,
    inactivation_reason text,
    updated_by          text,
    -- Empresa dona do registro. O painel tem seletor de empresa, e sem esta
    -- coluna todo cadastro feito com a Cordiva escolhida reaparecia na
    -- HealthMais -- o registro sumia da tela em que foi criado.
    -- text com default: a lista de empresas ainda e curta e vive na tela; um
    -- enum obrigaria migration a cada empresa nova. O default cobre o
    -- historico, que e todo da HealthMais.
    empresa             text NOT NULL DEFAULT 'healthmais',
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

CREATE INDEX idx_patients_situacao ON patients (situacao);

CREATE TABLE patient_events (
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
    -- Classe da Ouvidoria: so ela distingue quantitativa (manifestacoes) de
    -- qualitativa (NPS). Os demais cards ficam com NULL -- nao tem classe.
    classe          text,
    -- Instrumento NPS inteiro (Q1..Q5, nota, classe do respondente, melhorias,
    -- respondente, tratado). jsonb porque a apuracao -- %, zonas, mais citadas
    -- -- roda na aplicacao, nao em SQL; normalizar aqui nao pagaria.
    nps             jsonb,
    position        int NOT NULL,
    UNIQUE (patient_id, position),

    -- A tela exige observacao e responsavel. A regra tem que valer no banco
    -- tambem, senao vale so para quem usa o formulario. O legado escapa por
    -- origem_registro: 126 dos 206 eventos do dump nao tem observacao, e
    -- inventar uma seria pior do que admitir que nao existe. O NPS qualitativo
    -- tambem escapa: seu conteudo sao as respostas, e a Q4 e opcional.
    CONSTRAINT observacao_no_registro_novo CHECK (
        origem_registro = 'legado' OR classe = 'qualitativa'
        OR nullif(btrim(observations), '') IS NOT NULL),
    CONSTRAINT responsavel_no_registro_novo CHECK (
        origem_registro = 'legado' OR profissional_id IS NOT NULL),
    CONSTRAINT classe_valida CHECK (
        classe IS NULL OR classe IN ('quantitativa', 'qualitativa')),
    -- NPS so existe em evento qualitativo, e todo qualitativo tem NPS.
    CONSTRAINT nps_no_qualitativo CHECK (
        (nps IS NULL AND classe IS DISTINCT FROM 'qualitativa')
        OR (nps IS NOT NULL AND classe = 'qualitativa'))
);

-- Anexo em tabela propria, nao em coluna do evento: o conteudo chega a 5 MB, e
-- em coluna todo SELECT do evento arrastaria isso junto mesmo sem precisar.
CREATE TABLE anexos (
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

CREATE INDEX idx_anexos_evento ON anexos (evento_id);

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
