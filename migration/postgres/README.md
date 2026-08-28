# Migração MongoDB → Postgres

Preparação do schema e da carga, derivada do export real de 2026-08-28
(142 pacientes, 972 eventos no event store). O app continua no Mongo: aqui
só existe o alvo e o caminho dos dados até ele.

A carga **não é cópia crua** — três transformações acontecem no import, todas
reportadas ao fim da execução:

| Transformação | Efeito medido |
| --- | --- |
| Migração de inativação | 11 pacientes voltam visíveis como inativos (9 alta, 2 óbito); 50 seguem excluídos por exclusão manual |
| Categoria `Sem Operadora` | 3 pacientes sem `operatorId` ganham operadora sintética, o que permite `operator_id NOT NULL` |
| `social_assistance_reports` | 3 relatórios materializados pelo replay do event store |

Situação final dos 142 pacientes: **80 ativos, 12 inativos, 50 excluídos**.

## Rodar

```bash
# valida o modelo em memória, sem tocar em nenhum banco
python etl.py --src /caminho/do/export-2026-08-28

# gera o INSERT para o Postgres (fora do repo — carrega dado de paciente)
python etl.py --src /caminho/do/export-2026-08-28 --out /tmp/data.sql
```

No Postgres do Coolify, quando for a hora:

```bash
psql "$DATABASE_URL" -f schema.sql -f /tmp/data.sql
```

## Validação em duas camadas

**1. Modelo relacional — SQLite, dentro do `etl.py`.** Carrega tudo com
`foreign_keys=ON` e roda `foreign_key_check`: FKs resolvem, chaves únicas não
colidem, `NOT NULL` se sustenta, cardinalidade bate com a origem. O SQL emitido
também é executado, o que exercita o escape de aspas.

**2. Dialeto — Postgres real, em memória, via PGlite.** Postgres compilado em
WASM: roda sem servidor, sem Docker, sem instalar nada além de um pacote npm.

```bash
npm install @electric-sql/pglite
node pgtest.mjs /tmp/data.sql
```

Validado contra **PostgreSQL 18.3**: `schema.sql` aplica sem erro, a carga entra
em ~110ms, `jsonb` responde aos operadores (`data ? '$push'`), e `date` /
`timestamptz` aceitam comparação e `interval`.

Essa segunda camada não é redundante. Ela achou um bug que o SQLite não tem como
mostrar: **`subindicators.id` é `bigserial` e a carga traz id explícito, o que não
avança a sequence** — ela ficava em 1 com `max(id) = 32`, e o primeiro `INSERT`
do app quebrava com violação de PK. O `etl.py` agora emite o `setval`
correspondente no fim da carga.

## Decisões que vieram dos dados

| Decisão | Motivo observado |
| --- | --- |
| `events_store.data` fica `jsonb` | Carrega operadores mongo (`$push`, `$set`) e payload de formato variável. Normalizar quebraria o replay de `core/database.py`. |
| `patients.events` vira tabela | 206 eventos aninhados. Elimina a corrida de índice documentada em `docs/DEPLOY.md`, onde um `$set` por posição podia gravar no evento errado. |
| Evento liga por **nome** | O snapshot de indicador embutido no evento não tem `_id`. Os 206 casam por nome com indicador e subindicador — por isso `indicators.name` é `UNIQUE`. |
| `subindicators.id` sintético | Subindicador não tem `_id` no Mongo. A chave natural é `(indicator_id, name)`. |
| Sem `bytea` | `file` é nulo nos 142 pacientes. Se anexo voltar, entra como `bytea` ou referência externa. |
| Datas anuláveis | `birthDate` preenchido em 3 de 142, `admissionDate` em 9. String vazia vira `NULL`, não epoch. |

## Sobre a categoria de operadora

`Particular` **já existia** como operadora no Mongo (2 pacientes) — não foi
criada aqui. A única sintética é `Sem Operadora`, com id
`000000000000000000000001`, escolhido para não colidir com ObjectId real e ser
reconhecível a olho nu num `SELECT`.

Distribuição após a carga: Camperj 101, Unimed 36, Sem Operadora 3, Particular 2.

## Pendências

1. **A migração de inativação foi aplicada na carga, não no Mongo.** O Postgres
   sai correto, mas o Mongo continua com os 11 pacientes escondidos — e o app
   ainda roda nele. Enquanto os dois coexistirem, rodar
   `backend/migrate_inactivation.py` em produção mantém os dois lados iguais.

2. **Confirmar que não falta outra collection.** `social_assistance_reports` foi
   recuperada porque o event store a citava. Uma collection sem rastro no event
   store não apareceria dessa forma. O `getCollectionNames()` continua valendo
   como conferência.

3. **`/db/execute` fala mongo.** `backend/routers/proxy.py` traduz operações em
   `$push`/`$set`/`$pull` sobre o array aninhado. É a maior peça da migração do
   app e não está coberta aqui.
