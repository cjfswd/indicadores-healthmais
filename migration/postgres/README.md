# Migração MongoDB → Postgres

Preparação do schema e da carga, derivada do export real de 2026-08-28
(142 pacientes, 972 eventos no event store). O app continua no Mongo: aqui
só existe o alvo e o caminho dos dados até ele.

A carga **não é cópia crua** — três transformações acontecem no import, todas
reportadas ao fim da execução:

| Transformação | Efeito medido |
| --- | --- |
| Migração de inativação | 11 pacientes voltam visíveis como inativos (9 alta, 2 óbito); 50 seguem excluídos por exclusão manual |
| Operadora dos sem vínculo | 3 pacientes sem `operatorId` recebem `Particular`, que já existe — o que permite `operator_id NOT NULL` |
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

**1. Modelo — Python puro, dentro do `etl.py`.** Confere chaves primárias,
`UNIQUE`, FKs e cardinalidade antes de emitir qualquer SQL.

Isto rodava em SQLite até o schema ganhar `ENUM`, coluna gerada, `btrim` e
`octet_length`. Manter um tradutor de dialeto para um alvo que ninguém usa só
produzia falha falsa, então saiu.

**2. Dialeto — Postgres real, em memória, via PGlite.** Postgres compilado em
WASM: roda sem servidor, sem Docker, sem instalar nada além de um pacote npm.

```bash
npm install @electric-sql/pglite
node pgtest.mjs /tmp/data.sql
```

Validado contra **PostgreSQL 18.3**: `schema.sql` aplica sem erro, a carga entra
em ~110ms, `jsonb` responde aos operadores (`data ? '$push'`), e `date` /
`timestamptz` aceitam comparação e `interval`.

Essa segunda camada paga por si. O que ela pegou e nenhuma verificação em
memória pegaria:

- **`bigserial` com id explícito não avança a sequence.** Ficava em 1 com
  `max(id) = 32`, e o primeiro `INSERT` do app quebrava com violação de PK.
  Resolvido com `setval` no fim da carga.
- **Coluna gerada exige expressão `IMMUTABLE`.** `situacao` como `enum` foi
  recusada duas vezes — o `CASE` devolve `text`, e converter text em enum é
  `STABLE`. Ficou `text`.
- **`INSERT` posicional bate na coluna gerada.** A emissão passou a listar as
  colunas explicitamente.

## Decisões que vieram dos dados

| Decisão | Motivo observado |
| --- | --- |
| `events_store.data` fica `jsonb` | Carrega operadores mongo (`$push`, `$set`) e payload de formato variável. Normalizar quebraria o replay de `core/database.py`. |
| `patients.events` vira tabela | 206 eventos aninhados. Elimina a corrida de índice documentada em `docs/DEPLOY.md`, onde um `$set` por posição podia gravar no evento errado. |
| Evento liga por **nome** | O snapshot de indicador embutido no evento não tem `_id`. Os 206 casam por nome com indicador e subindicador — por isso `indicators.name` é `UNIQUE`. |
| `subindicators.id` sintético | Subindicador não tem `_id` no Mongo. A chave natural é `(indicator_id, name)`. |
| Anexo em tabela própria | 5 MB em coluna faria todo `SELECT` do evento arrastar o conteúdo. `CHECK` de tamanho no banco, não só na tela. |
| Datas anuláveis | `birthDate` preenchido em 3 de 142, `admissionDate` em 9. String vazia vira `NULL`, não epoch. |

## Sobre a operadora

Paciente sem `operatorId` é particular. Os 3 casos recebem a operadora
`Particular`, que já existia no Mongo com 2 pacientes — **nenhuma categoria
sintética é criada**.

Se `Particular` sumir do dump, o import para com erro em vez de inventar um id:
uma FK que resolve sozinha esconderia o problema.

Distribuição após a carga: Camperj 101, Unimed 36, Particular 5.

## Rodar no servidor

O container já tem Postgres com outras coisas dentro, então nada vai para
`public`: tudo vive no schema `painel`.

```bash
python gerar_migracao.py                       # gera migracoes/001_base.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migracoes/001_base.sql
```

O arquivo é **gerado** a partir de `schema.sql` e `schema_migracao.sql` — não
edite lá, senão os dois divergem. Ele é seguro num banco em uso:

- cria e usa `painel`; não escreve em `public`
- roda numa transação: falha no meio não deixa meia migração
- idempotente: `IF NOT EXISTS`, `OR REPLACE`, `DROP` antes do trigger
- registra a versão em `painel.migracoes`, com data e usuário

```bash
node testar_migracao.mjs migracoes/001_base.sql /tmp/data.sql
```

O teste sobe um Postgres em memória **com coisas já em `public`** — incluindo
uma tabela `patients` homônima de propósito — aplica, confere que nada de lá
foi tocado, aplica de novo e confere que não duplicou. As duas `patients`
convivem porque estão em schemas diferentes.

Limite conhecido: `CREATE TABLE IF NOT EXISTS` não adiciona coluna a tabela que
já existe. Este arquivo serve para a primeira aplicação; mudança de coluna
depois exige uma migração numerada nova com `ALTER` — que é por que ele já
nasce como `001`.

## O painel lendo do Postgres

`consultas_painel.sql` produz o mesmo `dados.json` que o painel já consome, uma
consulta por página. É o que permite trocar a fonte sem tocar na tela, e é o
que a API vai executar quando existir.

```bash
node painel_do_postgres.mjs /tmp/data.sql /tmp/dados-pg.json
```

Comparado campo a campo com o JSON gerado do dump, o resultado é **idêntico**
em pacientes, eventos, usuários, notificações e triagem. Duas diferenças
sobraram, e as duas são a migração fazendo o trabalho dela:

| Campo | Dump | Postgres | Por quê |
| --- | --- | --- | --- |
| `situacao` | 61 excluídos, 1 inativo | 50 e 12 | migração de inativação aplicada na carga |
| `operadoras.pacientes` | Particular com 2 | com 5 | os 3 sem vínculo viraram particulares |

A comparação achou dois defeitos meus antes disso, que valem registro porque
são os erros clássicos de portar leitura para SQL:

**Espaço em branco.** 33 observações diferiam só por espaço no fim — o gerador
do dump normalizava, o SQL não. Resolvido com `regexp_replace(btrim(...))`.

**Fuso horário.** Uma notificação caía num dia diferente: `to_char` usa o fuso
da sessão, e um registro perto da meia-noite muda de data. Todo `to_char` de
timestamp agora leva `AT TIME ZONE 'UTC'`. Sem isso o mesmo banco daria
respostas diferentes conforme o fuso do servidor.

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
