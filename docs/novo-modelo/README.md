# Novo modelo — recategorização dos indicadores

Registro da análise, do modelo alvo e da tela que hoje está no ar.
[`prototipo/painel.html`](prototipo/painel.html) deixou de ser protótipo: é o que a imagem do
frontend serve na raiz, e o app Vue está em standby em `/legado.html`. O resto desta pasta é
documentação do modelo e scripts de exportação.

Documento de origem: [Recategorizacao-dos-indicadores.pdf](Recategorizacao-dos-indicadores.pdf) — 10 cards,
com subcategorias, campos obrigatórios e regras novas.

---

## 1. Situação encontrada

O sistema atual tem 10 indicadores em `backend/seed_data.py`, semeados no MongoDB, e um
evento genérico (`occurrenceDate`, `indicator`, `subindicator`, `observations`,
`assistanceType`, `file`) embedado dentro do paciente.

Volume real medido no backup de 22/05/2026 (`backup/patients.json`): **134 pacientes, 105 eventos**.

| Origem | Eventos |
|---|---|
| card 06 antigo (AD/ID) | 83 (79%) |
| card 05 antigo (alterações de PAD) | 10 |
| card 01 antigo (fluxo) | 6 |
| cards 02, 03, 04, 07, 08 | 6 no total |

Duas consequências:

1. **A maior parte não é migração, é derivação.** Os 83 eventos de AD/ID não são fato no
   modelo novo — viram `episodio_cuidado.modalidade`. O último evento por paciente é o estado
   atual; os anteriores viram alteração de plano (4.3).
2. **Sobram ~12 registros ambíguos** (estágio da lesão, topografia da infecção, causa da
   internação, classificação do óbito). Com esse volume, é revisão humana numa planilha —
   não vale construir inferência.

> O backup versionado está 3 meses defasado. O dump real tem que sair de produção.

### Bloqueios da recategorização no código atual

- `backend/core/seeder.py` é aditivo por nome: só cria o que falta e adiciona subindicador novo.
  Trocar `seed_data.py` gera **indicadores duplicados**, não renomeia.
- Eventos guardam o nome do indicador no snapshot; todo dashboard casa por
  `e.indicator.name === ind.name`. Sem reescrever eventos, o histórico some dos cards.
- Hardcodes que quebram: `startsWith('06')` para AD/ID em `DashboardOverview.vue`;
  `ALLOWED_INDICATOR_PREFIXES = ['08 -','09 -','10 -']` em `SocialAssistanceFormView.vue`;
  `startsWith('08'/'09'/'10')` em `SocialAssistanceReportsView.vue`;
  `includes('adverso')` / `includes('ouvidoria')` em `useDashboardAnalytics.ts`;
  `isPadEvent` casando `'pad' + aumento/redução` em `EventFormModal.vue`.

---

## 2. Modelo Postgres

Princípio: os cards do documento não são 10 contadores, são **10 domínios com ciclo de vida**.
Três camadas — catálogo versionado, tabelas de fato, e o painel como *view*.

Ganho direto: "03 é espelho de 1.4 e não soma ao painel" deixa de ser regra de aplicação e vira
uma view sobre a saída por óbito. Mesma coisa para "a taxa de internação sai de 2.4".

### Núcleo

```sql
create type modalidade as enum ('AD','ID');
create type saida_motivo as enum (
  'alta_objetivo','alta_transicao','obito',
  'internacao_prolongada','desligamento_admin','transferencia');

create table episodio_cuidado (
  id              bigint generated always as identity primary key,
  paciente_id     bigint not null references paciente,
  contrato_id     bigint not null references contrato,
  modalidade      modalidade not null,
  complexidade    complexidade not null,
  origem_admissao origem_admissao not null,
  admissao_em     date not null,
  saida_em        date,
  saida_motivo    saida_motivo,
  solicitante     solicitante,          -- obrigatório só em desligamento_admin (1.6)
  constraint saida_coerente check ((saida_em is null) = (saida_motivo is null)),
  constraint saida_apos_admissao check (saida_em is null or saida_em >= admissao_em),
  constraint solicitante_no_desligamento check
    (saida_motivo is distinct from 'desligamento_admin' or solicitante is not null)
);
-- um episódio aberto por paciente
create unique index on episodio_cuidado (paciente_id) where saida_em is null;
```

Esse índice parcial é o tipo de regra que hoje mora em `if` espalhado no Vue — e a origem dos
bugs de inativação de paciente.

### Os dez domínios

| Card | Tabela | Fato | Derivados |
|---|---|---|---|
| 01 | `episodio_cuidado` | admissão + desfecho de saída | 1.1–1.7 |
| 02 | `intercorrencia` | causa + desfecho, hospital, retorno, evitabilidade | taxa de internação = desfecho 2.4 |
| 03 | `obito` (1:1 com saída por óbito) | local, tempo desde admissão, plano paliativo, diretivas | 3.1–3.3, view, não soma |
| 04 | `alteracao_plano` + `plano_cuidado` + `atendimento` | alteração 4.1–4.4; previsto vs realizado | aderência |
| 05 | `evento_adverso` | 5.1–5.9, grau do dano, evitabilidade, prazo de análise 7 dias | — |
| 06 | `lesao` + `avaliacao_lesao` | episódio com abertura/fechamento, Braden, PUSH, foto | admissão / adquirida / cicatrizada |
| 07 | `custo_lesao` | lançamento `numeric(12,2)` com `lesao_id` obrigatório | custo evitável, custo/episódio, glosa |
| 08 | `infeccao` + `uso_antimicrobiano` | topografia 8.1–8.8, dispositivo, cultura, dias | comunitária vs assistencial |
| 09 | `manifestacao` + `manifestacao_teor` | teor principal + adicionais, motivo, origem, SLA | — |
| 10 | `caso_vulnerabilidade` | 10.1–10.9, quem identificou, conduta, notificação | status `em_triagem` com prazo |

Regra do card 06 como coluna gerada, não job:

```sql
create table lesao (
  id            bigint generated always as identity primary key,
  episodio_id   bigint not null references episodio_cuidado,
  tipo          lesao_tipo not null,        -- 6.1 … 6.8
  local_anatomico text not null,
  aberta_em     date not null,
  fechada_em    date,
  avaliada_em   date,                       -- primeira avaliação com foto
  origem        lesao_origem generated always as (
      case when avaliada_em is not null
            and avaliada_em <= aberta_em + 2 then 'presente_admissao'
           else 'adquirida' end) stored
);
```

### Estrito para dado novo, honesto com o legado

O legado não tem os campos obrigatórios do documento. Em vez de enum `'nao_informado'`
(que contamina o modelo para sempre), cada tabela de fato leva:

```sql
origem_registro origem_registro not null default 'sistema',  -- 'sistema' | 'legado'
constraint causa_obrigatoria check (origem_registro = 'legado' or causa is not null)
```

### Transversais

- **Alertas**: óbito ≤48h e 3.3 → diretoria; ATB ≥10 dias sem reavaliação; SLA de 5 dias úteis
  na ouvidoria; triagem de 7 dias no card 10. Tudo é "existe X sem Y até o prazo Z" — job sobre view.
- **Competência**: `competencia (ano_mes, status)`. O fechamento recusa caso em triagem,
  análise causal vencida ou campo obrigatório faltando.
- **Auditoria**: trigger genérica (`old`/`new` em JSONB), substituindo o event store manual.
- **Catálogo versionado**: `categoria`/`subcategoria` com vigência. A próxima recategorização
  vira encerrar vigência e abrir nova, sem reescrever fato nenhum.

---

## 3. Stack proposta

```
apps/web     React + Vite + TS + Tailwind + shadcn/ui
             TanStack Query · TanStack Table · react-hook-form + zod
apps/api     Node + TS + Hono + ts-rest
packages/contract   schemas Zod — fonte única de API, formulários e validação
packages/db         Drizzle + migrations SQL
```

**Drizzle e não Prisma**: o modelo depende de `CHECK`, índice parcial e coluna gerada — Prisma
não expressa nada disso no schema, e metade das regras acabaria em migration solta.

---

## 4. Plano de corte

| Fase | O quê |
|---|---|
| 0 | Backup e congelamento: `mongodump` + export JSON de produção, com checksum. Nada entra no sistema velho depois do dump. |
| 1 | Inventário: script sobre o dump gerando o de-para com contagens e a lista de casos ambíguos. |
| 2 | Planilha de-para dos ambíguos, revisada por quem conhece os casos. É entrada do loader, versionada. |
| 3 | Loader idempotente: dump + planilha → Postgres em transação, com `legacy_id` único. |
| 4 | Conciliação: total por card/mês, Mongo vs Postgres. Cards 01/02/04/09 batem exato. É o teste de aceite. |
| 5 | Corte: sistema velho vira read-only por duas competências. |

Ordem de construção: `episodio_cuidado` + cards 01, 02, 03 (view) e 04. É onde estão 90% dos
eventos reais e valida o modelo de episódio antes de investir em 06 e 07.

---

## 5. O painel

[`prototipo/painel.html`](prototipo/painel.html) — página única, sem dependência externa,
com os dez cards. É o que a imagem do frontend serve na raiz (`frontend/Dockerfile`), então
não é mais protótipo: é a tela por onde a assistência entra.

**Nenhum número é inventado.** Os dez cards não guardam linha própria: cada um lê os registros
que a equipe gravou (`GET /painel/dados`) e os coloca no catálogo novo pelo de-para do
`MAPA_LEGADO`, transcrito de [`migration/catalogo_novo.py`](../../migration/catalogo_novo.py).
Registro que o rótulo antigo não consegue traduzir fica **Em triagem** e aparece na página de
Migração, com a explicação de por que precisa de decisão. Card sem registro aparece vazio, e o
vazio é a resposta — cards 07 (custo) e 10 (vulnerabilidade) nunca tiveram onde ser registrados,
e dizem isso na tela em vez de mostrar exemplo.

Os 83 registros de "06 - Quantitativo de pacientes AD e ID" não viram linha de card nenhum:
são a modalidade do paciente, atributo do acompanhamento. Eles continuam visíveis em Relatórios,
sob "Modalidade do paciente".

Contém: filtros globais retrocompatíveis (bimestre com os presets do `filterStore` atual, De/Até
com prioridade, operadora vinda do cadastro, modalidade), metas por card — só as que o dado real
sustenta, e o selo some quando não há registro categorizado para julgar —, três views por card
(tabela, board, evolução mensal), drill-down da linha do pivô para a tabela, side peek com a
categoria decidível e a lista de campos obrigatórios que o histórico não tem, paleta de comandos
(⌘K), menu de exportação, e as páginas de Operação sobre o mesmo dado.

**Escopo por empresa.** Enquanto o modelo novo não carrega `empresa_id`, todo registro do banco
é da HealthMais — a única que operou o sistema. A Córdiva aparece vazia de propósito: ela ainda
não tem registro, e mostrar evento da HealthMais na view dela seria inventar histórico.

**Gravação.** Novo registro, cadastro de paciente e de operadora gravam em
`POST /db/execute` — o mesmo endpoint do resto do sistema, com event store, soft update e
`SOFT_DELETE`. Depois de gravar a tela relê a fonte, em vez de remendar o array em memória.
Registro criado pelo painel nasce no catálogo novo (`catalogo: "recategorizacao-2026"`) e não
passa pelo de-para: quem registrou escolheu a categoria na hora.

Para abrir: precisa de servidor HTTP (a página busca `/painel/dados`), e de sessão para ver
dado real.

---

## 5.1 O que o painel exige do banco

O painel grava, e gravar mexe em duas regras que o modelo já tinha.

**Inativação automática.** Alta e óbito escondem o paciente da carteira, e a
regra casava por prefixo do nome do indicador. O catálogo novo reaproveita os
mesmos prefixos com outro significado: `01 - Movimentação da Carteira` /
`1.1 - Admissão` batia em `("01", "1.1", "alta")` e **inativava o paciente no ato
de admiti-lo**, enquanto o óbito novo (1.4) não inativava ninguém. Agora a origem
do registro decide a tabela: quem carrega `catalogo` usa o código da saída
(1.2/1.3 → alta, 1.4 → óbito); o histórico segue no de-para antigo. Vale nos dois
lados — `backend/routers/proxy.py` e `migration/postgres/etl.py`.

**Catálogo novo como linha de banco.** `patient_events.indicator_id` é NOT NULL
com FK para `indicators`, e os dez cards da recategorização não nascem no Mongo
— nascem do PDF. O carregador passa a emitir os dez, com id determinístico
(`catalogo2026cardNN000000`), ao lado dos nove antigos. Sem isso ele abortava no
primeiro registro feito depois do corte.

**Empresa.** `patients.empresa` (`text NOT NULL DEFAULT 'healthmais'`) é o que
mantém o cadastro na empresa em que foi criado. Operadora, conta de acesso,
trilha e notificação continuam compartilhadas: as duas empresas atendem pelos
mesmos convênios e pelas mesmas contas.

**Registro novo é `origem_registro = 'sistema'`**, e os CHECK do schema passam a
valer para ele: observação e profissional responsável são obrigatórios. O
histórico continua `legado`, sem esses campos.

Verificado ponta a ponta contra Postgres de verdade (PGlite):
`etl.py` → `pgtest.mjs` → `painel_do_postgres.mjs`.

---

## 6. Exportações

[`exportacoes/`](exportacoes) gera PDF, XLSX e PPTX a partir dos **mesmos dados da tela** —
relatório e painel não podem divergir.

> `prototipo/painel.json` e as saídas em [`saidas/`](saidas) foram gerados quando o painel ainda
> carregava dados de exemplo. Enquanto não forem regerados contra o dado real, valem como
> amostra do formato, não como número da competência.

```bash
cd docs/novo-modelo/prototipo
node dump.mjs                 # painel.html -> painel.json (precisa de happy-dom)
cd ../exportacoes
python gerar_pdf.py && python gerar_xlsx.py && python gerar_pptx.py
```

Dependências: `happy-dom` (node), `reportlab`, `openpyxl`, `python-pptx` (python).
Saídas de exemplo em [`saidas/`](saidas).

- **PDF** (reportlab, 14 páginas): capa, sumário executivo, uma página por card com KPIs,
  pivô mensal e pendências, retrocompatibilidade, assinatura.
- **XLSX** (openpyxl, 15 abas): resumo, uma aba por card, pivô mensal, alertas, metas,
  retrocompatibilidade. Valores em R$ e % como número formatado, não texto.
- **PPTX** (python-pptx, 14 slides): capa, sumário em grade, um slide por card com gráfico
  nativo de colunas, consolidado de pendências, retrocompatibilidade.

Na stack real: `exceljs`, `pptxgenjs` e PDF via HTML→Playwright ou worker Python, todos lendo
as mesmas views do Postgres que alimentam a tela.

---

## 7. Decisões pendentes

1. **Corte do histórico** — legado em schema separado só para consulta, ou migrar o que mapeia?
2. **Event sourcing** — abandonar em favor de tabelas normais + auditoria por trigger (assumido
   neste desenho), ou é requisito manter?
3. **Cards 04-execução e 07-custo** — entram na v1 com lançamento manual, ou ficam fora até
   existirem as integrações (almoxarifado, escala, custo/hora, faturamento)?

Respondidas as três, o próximo passo é `/specify` — o desenho acima vira spec com critério de
aceite, e o DDL e o loader saem do plano em vez do improviso.
