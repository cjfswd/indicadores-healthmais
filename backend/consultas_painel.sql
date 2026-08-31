-- Consultas que alimentam o painel, uma por página.
--
-- Hoje o painel lê um dados.json montado a partir do dump. Estas consultas
-- produzem exatamente o mesmo conteúdo a partir do Postgres — mesma forma,
-- mesmos nomes de campo. É o que permite trocar a fonte sem tocar na tela, e
-- é o que a API vai executar quando existir.
--
-- Cada bloco é separado por uma linha `-- @nome`; o runner as separa por isso.

-- @operadoras
SELECT o.id,
       o.name AS nome,
       to_char(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS criado,
       count(p.id)::int AS pacientes
FROM operators o
LEFT JOIN patients p ON p.operator_id = o.id
GROUP BY o.id, o.name, o.created_at
ORDER BY o.name;

-- @pacientes
SELECT p.id,
       p.name AS nome,
       o.name AS operadora,
       -- situacao vem da coluna gerada: a regra mora no banco, nao aqui.
       p.situacao,
       coalesce(p.inactivation_reason, '') AS motivo,
       coalesce(to_char(p.birth_date, 'YYYY-MM-DD'), '') AS nascimento,
       coalesce(to_char(p.admission_date, 'YYYY-MM-DD'), '') AS admissao,
       count(e.id)::int AS eventos,
       -- Mesma normalizacao do gerador do dump: espaco colapsado e aparado.
       -- Sem isto 33 observacoes diferiam so por espaco no fim.
       regexp_replace(btrim(coalesce(p.observations, '')), '\s+', ' ', 'g') AS observacoes,
       to_char(p.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS criado,
       to_char(p.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS atualizado,
       coalesce(p.updated_by, '') AS atualizado_por,
       coalesce(to_char(p.inactivated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'), '') AS inativado,
       to_char(p.deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS excluido
FROM patients p
JOIN operators o ON o.id = p.operator_id
LEFT JOIN patient_events e ON e.patient_id = p.id
GROUP BY p.id, p.name, o.name, p.situacao, p.inactivation_reason, p.birth_date,
         p.admission_date, p.observations, p.created_at, p.updated_at,
         p.updated_by, p.inactivated_at, p.deleted_at
ORDER BY p.name;

-- @eventos
SELECT e.id,
       e.patient_id AS paciente_id,
       p.name AS paciente,
       o.name AS operadora,
       to_char(e.occurrence_date, 'YYYY-MM-DD') AS data,
       -- O codigo do card sai do proprio nome do indicador, como no de-para.
       substring(i.name from '^\s*(\d+)') AS card,
       i.name AS indicador,
       coalesce(s.name, '') AS subindicador,
       coalesce(e.assistance_type, '') AS assistencia,
       regexp_replace(btrim(coalesce(e.observations, '')), '\s+', ' ', 'g') AS observacoes,
       EXISTS (SELECT 1 FROM anexos a WHERE a.evento_id = e.id) AS anexo
FROM patient_events e
JOIN patients p ON p.id = e.patient_id
JOIN operators o ON o.id = p.operator_id
JOIN indicators i ON i.id = e.indicator_id
LEFT JOIN subindicators s ON s.id = e.subindicator_id
ORDER BY e.occurrence_date DESC NULLS LAST, e.id;

-- @auditoria
SELECT es.id,
       es.stream_type AS stream,
       es.stream_id,
       es.event_type AS tipo,
       es.version AS versao,
       to_char(es."timestamp" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') AS quando,
       coalesce(es.actor, '') AS ator,
       -- Os operadores mongo ficam separados dos campos comuns, como na tela.
       (SELECT coalesce(array_agg(k ORDER BY k), '{}')
          FROM jsonb_object_keys(coalesce(es.data, '{}'::jsonb)) k
         WHERE k NOT LIKE '$%') AS campos,
       (SELECT coalesce(array_agg(k ORDER BY k), '{}')
          FROM jsonb_object_keys(coalesce(es.data, '{}'::jsonb)) k
         WHERE k LIKE '$%') AS operadores
FROM events_store es
ORDER BY es."timestamp" DESC;

-- @notificacoes
SELECT n.id,
       coalesce(n.title, '') AS titulo,
       regexp_replace(btrim(coalesce(n.message, '')), '\s+', ' ', 'g') AS mensagem,
       coalesce(n.type, '') AS tipo,
       n.is_read AS lida,
       coalesce(n.link, '') AS link,
       -- AT TIME ZONE 'UTC' e obrigatorio: to_char usa o fuso da sessao, e
       -- um registro perto da meia-noite caía num dia diferente do dump.
       to_char(n.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS quando,
       (n.deleted_at IS NOT NULL) AS removida
FROM notifications n
ORDER BY n.created_at DESC;

-- @usuarios
SELECT u.id,
       u.name AS nome,
       u.email,
       split_part(u.email, '@', 2) AS dominio,
       to_char(u.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS criado,
       (SELECT count(*)::int FROM events_store es WHERE es.actor = u.email) AS registros
FROM users u
ORDER BY registros DESC;

-- @triagem
SELECT r.id,
       coalesce(r.patient_name_raw, '') AS nome_bruto,
       (r.linked_patient_id IS NOT NULL) AS vinculado,
       coalesce(r.linked_patient_name, '') AS paciente,
       coalesce(to_char(r.occurrence_date, 'YYYY-MM-DD'), '') AS data,
       coalesce(i.name, '') AS indicador,
       coalesce(s.name, '') AS subindicador,
       coalesce(r.reporter_name, '') AS relator,
       coalesce(r.reporter_contact, '') AS contato,
       regexp_replace(btrim(coalesce(r.observations, '')), '\s+', ' ', 'g') AS observacoes,
       coalesce(r.status, '') AS status
FROM social_assistance_reports r
LEFT JOIN indicators i ON i.id = r.indicator_id
LEFT JOIN subindicators s ON s.id = r.subindicator_id
ORDER BY r.id;

-- @profissionais
SELECT pr.id, pr.nome, coalesce(pr.email, '') AS email, pr.ativo
FROM profissionais pr
WHERE pr.ativo
ORDER BY pr.nome;
