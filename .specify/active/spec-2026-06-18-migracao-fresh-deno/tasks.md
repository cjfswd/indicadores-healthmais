# Tasks — spec-2026-06-18-migracao-fresh-deno

**Spec:** `.specify/active/spec-2026-06-18-migracao-fresh-deno/spec.md`  
**Plan:** `.specify/active/spec-2026-06-18-migracao-fresh-deno/plan.md`  
**Gerado em:** 2026-06-18

---

## Grafo de Dependências

```
task-001 (scaffold Fresh)
task-002 (core/db.ts)          ← paralelo com 001 e 003
task-003 (core/events.ts)      ← paralelo com 001 e 002
        │
        ▼
task-004 (api/auth/google)     ← depende de 002
task-005 (api/db/execute)      ← depende de 002 + 003
task-006 (api/db/file)         ← depende de 002
task-007 (core/report)         ← depende de 001 (independente de db)
        │
        ▼
task-008 (core/auth middleware) ← depende de 004
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
task-009 (islands/PatientList+Form)     task-010 (islands/EventList+Form)
task-011 (islands/DashboardCharts)      task-012 (islands/ReportExport)
task-013 (routes/login)                        │
        │                                      │
        ▼                                      ▼
task-014 (routes/dashboard)            task-015 (routes/pacientes)
task-016 (routes/eventos)              task-017 (components/Layout)
        │
        ▼
task-018 (Dockerfile + docker-compose)
```

**Níveis de paralelismo:**
- **Nível 1 (paralelo):** task-001, task-002, task-003
- **Nível 2 (paralelo após nível 1):** task-004, task-005, task-006, task-007
- **Nível 3:** task-008 (após task-004)
- **Nível 4 (paralelo após 008 + 005):** task-009, task-010, task-011, task-012, task-013
- **Nível 5 (paralelo após nível 4):** task-014, task-015, task-016, task-017
- **Nível 6:** task-018 (após todos)

---

## Tasks

---

### task-001 — Scaffold do projeto Fresh

**Status:** todo  
**Dependências:** nenhuma  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-001`

**O que fazer:**  
Criar a estrutura base do projeto Fresh/Deno dentro de um diretório `fresh-app/` na raiz do repositório. Configurar Tailwind v4, estrutura de pastas e entry point.

**Arquivos a criar:**
- `fresh-app/deno.json` — imports map com `npm:mongodb`, `npm:jose`, `npm:chart.js`, `npm:zod`, `jsr:@fresh/*`, `jsr:@preact/*`
- `fresh-app/fresh.config.ts` — plugin Tailwind
- `fresh-app/main.ts` — entry point com `await start(manifest, config)`
- `fresh-app/fresh.gen.ts` — gerado pelo Fresh CLI
- `fresh-app/tailwind.config.ts` — configuração Tailwind v4
- `fresh-app/static/styles.css` — `@tailwind base/components/utilities`
- `fresh-app/routes/index.tsx` — redirect 302 para `/dashboard`
- `fresh-app/.env.example` — todas as variáveis necessárias documentadas

**Critério de done:**
- [ ] `deno task start` sobe servidor Fresh sem erros
- [ ] `deno check **/*.ts` passa sem erros de tipo
- [ ] Rota `/` redireciona para `/dashboard`
- [ ] Tailwind gera CSS (classe `text-blue-500` aplicada visualmente)

---

### task-002 — core/db.ts — Conexão MongoDB

**Status:** todo  
**Dependências:** nenhuma  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-002`

**O que fazer:**  
Criar `fresh-app/core/db.ts` com conexão singleton ao MongoDB usando `npm:mongodb`. Ler `MONGO_URI` e `DB_NAME` de `Deno.env`. Exportar função `getDb()` que retorna o `Db` instance.

**Arquivos a criar:**
- `fresh-app/core/db.ts`

**Critério de done:**
- [ ] `getDb()` retorna instância `Db` sem abrir nova conexão se já conectado
- [ ] Lança erro claro se `MONGO_URI` ou `DB_NAME` não estiverem definidos
- [ ] `deno check fresh-app/core/db.ts` sem erros
- [ ] Teste manual: conectar e listar collections com `getDb().listCollections().toArray()`

---

### task-003 — core/events.ts — Event Sourcing

**Status:** todo  
**Dependências:** nenhuma (usa tipos de db.ts mas não o módulo em runtime)  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-003`

**O que fazer:**  
Portar `backend/core/database.py` para TypeScript. Implementar `appendEvent()` e `materializeSnapshot()` com a mesma lógica do Python: append-only event store, snapshot materializado por upsert/merge/soft-delete, version auto-increment por stream.

**Arquivos a criar:**
- `fresh-app/core/events.ts`

**Lógica crítica a preservar (do Python):**
- `version` = `max(version) + 1` por `(streamId, streamType)`
- `CREATE` → upsert completo com `createdAt`, `deletedAt: null`
- `UPDATE` → `$set` dos campos do `data`, preserva `_id`, `createdAt`, `deletedAt`
- `SOFT_DELETE` → `$set { deletedAt: new Date(), updatedAt: new Date() }`
- Arquivos base64 em `UPDATE`: preservar arquivo existente se `data.file` for `null`

**Critério de done:**
- [ ] `appendEvent("patients", id, "CREATE", data, actor)` insere em `events_store` e retorna snapshot
- [ ] `appendEvent(..., "UPDATE", ...)` faz merge sem sobrescrever `createdAt`
- [ ] `appendEvent(..., "SOFT_DELETE", ...)` seta `deletedAt` sem apagar dados
- [ ] Version é único por stream (teste com 3 eventos sequenciais)
- [ ] `deno check fresh-app/core/events.ts` sem erros

---

### task-004 — routes/api/auth/google.ts — Autenticação Google OAuth2

**Status:** todo  
**Dependências:** task-002  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-004`

**O que fazer:**  
Implementar `POST /api/auth/google` que recebe `{ access_token }` (Google token), valida com `googleapis/v3/userinfo`, cria/recupera usuário no MongoDB, e retorna JWT HS256 com payload `{ id, email }`.

**Arquivos a criar:**
- `fresh-app/routes/api/auth/google.ts`

**Detalhes:**
- Algoritmo: HS256 com `npm:jose`
- Secret: `Deno.env.get("JWT_SECRET")`
- Payload JWT: `{ id: string, email: string }` (igual ao Python atual)
- Sem expiração no token (preservar comportamento atual)
- Criar user em `users` collection se não existir

**Critério de done:**
- [ ] `POST /api/auth/google` com token Google válido retorna `{ success: true, token, user }`
- [ ] `POST /api/auth/google` com token inválido retorna 401
- [ ] JWT gerado é verificável com `jose.jwtVerify` usando o mesmo secret
- [ ] `deno check` sem erros

---

### task-005 — routes/api/db/execute.ts — CRUD com Event Sourcing

**Status:** todo  
**Dependências:** task-002, task-003  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-005`

**O que fazer:**  
Implementar `POST /api/db/execute` que replica o comportamento de `backend/routers/proxy.py`. Recebe metadata no header `x-db-meta` (JSON) e body opcional. Suporta actions: `find`, `findOne`, `insert`, `update`, `delete`.

**Arquivos a criar:**
- `fresh-app/routes/api/db/execute.ts`

**Lógica crítica:**
- `find`: `collection.find({ deletedAt: null, ...filters }).skip(skip).limit(limit)`
- `insert`: `appendEvent(collection, newId, "CREATE", data, actor)`
- `update`: `appendEvent(collection, id, "UPDATE", data, actor)`
- `delete`: `appendEvent(collection, id, "SOFT_DELETE", {}, actor)`
- Actor extraído do JWT (header `Authorization: Bearer token`)
- Retorno: `{ result, total?, success, message? }`

**Critério de done:**
- [ ] `find` retorna lista paginada com `total`
- [ ] `insert` cria snapshot e evento em `events_store`
- [ ] `update` faz merge sem perder campos imutáveis
- [ ] `delete` seta `deletedAt`, não aparece em queries subsequentes
- [ ] Requisição sem JWT válido retorna 401
- [ ] `deno check` sem erros

---

### task-006 — routes/api/db/file — Download de arquivos

**Status:** todo  
**Dependências:** task-002  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-006`

**O que fazer:**  
Implementar `GET /api/db/file/[collection]/[id]/[index]` que busca documento no MongoDB, extrai campo `file.data` (base64), decodifica e retorna como `Response` com o Content-Type correto.

**Arquivos a criar:**
- `fresh-app/routes/api/db/file/[collection]/[id]/[index].ts`

**Critério de done:**
- [ ] Request retorna arquivo com `Content-Type` correto
- [ ] Arquivo base64 é decodificado corretamente (sem corrupção)
- [ ] Documento inexistente retorna 404
- [ ] `deno check` sem erros

---

### task-007 — core/report.ts — Geração PDF e PPTX

**Status:** todo  
**Dependências:** task-001 (para deno.json com imports)  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-007`

**O que fazer:**  
Implementar `fresh-app/core/report.ts` com funções `generatePdf()` e `generatePptx()` usando `npm:pdf-lib` e `npm:pptxgenjs`. Recebem o mesmo payload que o Python atual: `{ title, subtitle, headers, data, charts[] }`.

**Arquivos a criar:**
- `fresh-app/core/report.ts`
- `fresh-app/routes/api/report/generate.ts`

**PDF (pdf-lib):**
- Título + subtítulo no topo
- Imagens de gráficos (base64 PNG → `PDFImage`)
- Tabela pivot com zebra striping
- Subindicadores indentados

**PPTX (pptxgenjs):**
- Slide 1: título (fundo escuro)
- Slides 2..N: um gráfico por slide
- Slide final: tabela de dados

**Critério de done:**
- [ ] `generatePdf(payload)` retorna `Uint8Array` de PDF válido
- [ ] `generatePptx(payload)` retorna `Uint8Array` de PPTX válido
- [ ] `POST /api/report/generate` retorna arquivo para download
- [ ] PDF contém tabela com dados e pelo menos uma imagem de gráfico
- [ ] `deno check` sem erros

---

### task-008 — core/auth.ts — Middleware JWT

**Status:** todo  
**Dependências:** task-004  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-008`

**O que fazer:**  
Implementar middleware Fresh que verifica JWT em todas as rotas protegidas. Rotas públicas: `/login`, `/api/auth/google`. Todas as outras redirecionam para `/login` se JWT ausente ou inválido.

**Arquivos a criar:**
- `fresh-app/core/auth.ts` — função `requireAuth(req, ctx)`
- `fresh-app/routes/_middleware.ts` — aplica `requireAuth` globalmente

**Critério de done:**
- [ ] Acesso a `/dashboard` sem JWT redireciona para `/login`
- [ ] Acesso a `/api/db/execute` sem JWT retorna 401 JSON
- [ ] Acesso com JWT válido passa para o handler normalmente
- [ ] JWT expirado ou malformado tratado igual a ausente
- [ ] `deno check` sem erros

---

### task-009 — islands/PatientList.tsx + islands/PatientForm.tsx

**Status:** todo  
**Dependências:** task-008, task-005  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-009`

**O que fazer:**  
Criar duas islands Preact para gestão de pacientes:
- `PatientList`: lista paginada (10/página), filtros por nome e operadora, chips de eventos e arquivo, botões editar/deletar com confirmação
- `PatientForm`: modal criar/editar com campos nome, operadora, datas, observações, upload de arquivo (base64, 5MB max)

**Arquivos a criar:**
- `fresh-app/islands/PatientList.tsx`
- `fresh-app/islands/PatientForm.tsx`
- `fresh-app/components/ConfirmDialog.tsx`

**Critério de done:**
- [ ] Lista exibe pacientes paginados buscados de `/api/db/execute`
- [ ] Filtro por nome e operadora funciona (debounce 300ms)
- [ ] Criar paciente abre modal, submete, lista atualiza
- [ ] Editar preenche modal com dados existentes
- [ ] Deletar exibe confirmação, remove após confirmar
- [ ] Upload de arquivo convertido para base64 antes de enviar
- [ ] `deno check` sem erros

---

### task-010 — islands/EventList.tsx + islands/EventForm.tsx

**Status:** todo  
**Dependências:** task-008, task-005  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-010`

**O que fazer:**  
Criar duas islands Preact para gestão de eventos:
- `EventList`: lista paginada, filtros por paciente/indicador/sub-indicador, suporta query param `?patientId=`
- `EventForm`: modal criar/editar com paciente, data ocorrência, indicador, sub-indicador, tipo de assistência (condicional se PAD), observações, arquivo

**Arquivos a criar:**
- `fresh-app/islands/EventList.tsx`
- `fresh-app/islands/EventForm.tsx`

**Critério de done:**
- [ ] Lista exibe eventos paginados com filtros funcionando
- [ ] `?patientId=` pré-filtra eventos do paciente
- [ ] Sub-indicador popula dinamicamente ao selecionar indicador
- [ ] Campo assistência aparece apenas para indicadores PAD
- [ ] Criar/editar/deletar funcionando com confirmação
- [ ] `deno check` sem erros

---

### task-011 — islands/DashboardCharts.tsx + SubindicatorCharts.tsx

**Status:** todo  
**Dependências:** task-008, task-005  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-011`

**O que fazer:**  
Criar islands para o dashboard com toda a lógica analítica de `useDashboardAnalytics.ts` portada para TypeScript puro (sem Vue):
- `DashboardCharts`: cards de indicadores, gráfico de barras (Chart.js), gráfico de linha (Chart.js), tabela pivot mensal, filtros de data
- `SubindicatorCharts`: gráficos de barra por sub-indicador (um por indicador)

**Arquivos a criar:**
- `fresh-app/islands/DashboardCharts.tsx`
- `fresh-app/islands/SubindicatorCharts.tsx`
- `fresh-app/core/analytics.ts` — lógica de `useDashboardAnalytics` portada (puro TS, sem reatividade Vue)

**Lógica crítica a portar de `useDashboardAnalytics.ts`:**
- Indicador 06 (AD/ID): contar estado atual do último evento por paciente
- Pivot table: agrupar eventos por mês/indicador
- Cálculo de tendência (30 dias vs 30-60 dias)

**Critério de done:**
- [ ] Cards exibem total de eventos por indicador
- [ ] Gráfico de barras renderiza com Chart.js (sem erro de DOM)
- [ ] Gráfico de linha mostra evolução mensal dos últimos 6 meses
- [ ] Tabela pivot agrupa corretamente por mês
- [ ] Filtro por data inicial/final atualiza todos os dados
- [ ] Estado vazio exibido quando não há eventos
- [ ] Chart.js destruído no cleanup do `useEffect`
- [ ] `deno check` sem erros

---

### task-012 — islands/ReportExport.tsx

**Status:** todo  
**Dependências:** task-007, task-008  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-012`

**O que fazer:**  
Criar island que contém os botões "Exportar PDF" e "Exportar PPTX". Coleta imagens dos gráficos via `canvas.toDataURL()`, monta payload e faz POST para `/api/report/generate`, baixa o arquivo retornado.

**Arquivos a criar:**
- `fresh-app/islands/ReportExport.tsx`

**Critério de done:**
- [ ] Botão PDF em estado loading durante geração
- [ ] Botão PPTX em estado loading durante geração
- [ ] Download iniciado automaticamente ao receber resposta
- [ ] Erro exibe notificação sem travar a página
- [ ] `deno check` sem erros

---

### task-013 — routes/login.tsx — Página de Login

**Status:** todo  
**Dependências:** task-008  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-013`

**O que fazer:**  
Criar página SSR de login com botão "Entrar com Google". Reproduzir o fluxo atual: redirect para Google OAuth2, capturar `#access_token` do hash, POST para `/api/auth/google`, salvar token em localStorage, redirecionar para `/dashboard`.

**Arquivos a criar:**
- `fresh-app/routes/login.tsx`
- `fresh-app/islands/LoginButton.tsx` — island para lógica do OAuth (acesso ao `window.location.hash`)

**Critério de done:**
- [ ] Página renderiza botão de login Google (SSR)
- [ ] Clique no botão redireciona para Google OAuth2
- [ ] Após OAuth, hash `#access_token` é capturado e enviado para `/api/auth/google`
- [ ] Token salvo em `localStorage` e redirect para `/dashboard`
- [ ] Erro de autenticação exibe mensagem sem redirect
- [ ] `deno check` sem erros

---

### task-014 — routes/dashboard.tsx — Página Dashboard

**Status:** todo  
**Dependências:** task-011, task-012, task-013  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-014`

**O que fazer:**  
Criar a rota SSR `/dashboard` que monta o shell da página com `Layout` e injeta as islands `DashboardCharts`, `SubindicatorCharts` e `ReportExport`.

**Arquivos a criar:**
- `fresh-app/routes/dashboard.tsx`

**Critério de done:**
- [ ] Página carrega com nav lateral e conteúdo do dashboard
- [ ] Islands de charts montadas e funcionando
- [ ] Botões de exportação presentes
- [ ] Sem JWT → redirect para `/login`
- [ ] `deno check` sem erros

---

### task-015 — routes/pacientes.tsx — Página Pacientes

**Status:** todo  
**Dependências:** task-009, task-013  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-015`

**O que fazer:**  
Criar rota SSR `/pacientes` com shell + island `PatientList`.

**Arquivos a criar:**
- `fresh-app/routes/pacientes.tsx`

**Critério de done:**
- [ ] Página carrega com lista de pacientes
- [ ] CRUD completo funciona via island
- [ ] Sem JWT → redirect para `/login`
- [ ] `deno check` sem erros

---

### task-016 — routes/eventos.tsx — Página Eventos

**Status:** todo  
**Dependências:** task-010, task-013  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-016`

**O que fazer:**  
Criar rota SSR `/eventos` com shell + island `EventList`. Suportar query param `?patientId=`.

**Arquivos a criar:**
- `fresh-app/routes/eventos.tsx`

**Critério de done:**
- [ ] Página carrega com lista de eventos
- [ ] `?patientId=` filtra corretamente
- [ ] CRUD completo via island
- [ ] Sem JWT → redirect para `/login`
- [ ] `deno check` sem erros

---

### task-017 — components/Layout.tsx — Nav Lateral

**Status:** todo  
**Dependências:** task-001  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-017`

**O que fazer:**  
Criar componente estático (não island) de layout com nav lateral contendo links para Dashboard, Pacientes, Eventos, Indicadores. Header com nome do usuário e botão de logout.

**Arquivos a criar:**
- `fresh-app/components/Layout.tsx`
- `fresh-app/components/EmptyState.tsx`
- `fresh-app/islands/LogoutButton.tsx` — island para logout (acesso ao localStorage)

**Critério de done:**
- [ ] Nav lateral exibe todos os links de navegação
- [ ] Link ativo destacado visualmente
- [ ] Botão logout limpa localStorage e redireciona para `/login`
- [ ] Layout responsivo (mobile: nav colapsável)
- [ ] `deno check` sem erros

---

### task-018 — Dockerfile + docker-compose.yml

**Status:** todo  
**Dependências:** task-001 até task-017  
**Worktree:** `spec-2026-06-18-migracao-fresh-deno-task-018`

**O que fazer:**  
Criar `Dockerfile` para o projeto Fresh/Deno e atualizar `docker-compose.yml` removendo o serviço `backend` (Python) e `frontend` (nginx), substituindo por um único serviço `app` (Deno).

**Arquivos a criar/modificar:**
- `fresh-app/Dockerfile`
- `docker-compose.yml` (atualizado)

**Dockerfile:**
```dockerfile
FROM denoland/deno:alpine
WORKDIR /app
COPY . .
RUN deno cache main.ts
EXPOSE 8000
CMD ["deno", "task", "start"]
```

**Critério de done:**
- [ ] `docker build` conclui sem erros
- [ ] `docker-compose up` sobe o serviço e responde em `http://localhost:8000`
- [ ] Variáveis de ambiente do `COOLIFY_ENV.txt` funcionam no container
- [ ] Serviços Python e nginx removidos do compose

---

## Cobertura de Critérios de Aceite

| Critério (spec) | Task(s) que cobrem |
|----------------|-------------------|
| Autenticar com Google OAuth2 + JWT | task-004, task-013 |
| Redirect para /login sem JWT | task-008 |
| Bloquear API sem JWT | task-008 |
| Cards de indicadores no dashboard | task-011 |
| Gráfico de barras Chart.js | task-011 |
| Gráfico de linha Chart.js | task-011 |
| Tabela pivot mensal | task-011 |
| Filtro por data | task-011 |
| Estado vazio no dashboard | task-011 |
| Listar pacientes paginados | task-009, task-015 |
| Filtrar pacientes | task-009 |
| CRUD pacientes | task-009 |
| Confirmação de exclusão | task-009 |
| Listar indicadores | task-005 (API) |
| Registrar eventos | task-010 |
| Filtrar eventos | task-010 |
| Exportar PDF | task-007, task-012 |
| Exportar PPTX | task-007, task-012 |
| Incluir gráficos no relatório | task-007, task-012 |
| Rodar em Deno sem Python/Node | task-001, task-018 |
| Preservar dados MongoDB | task-003, task-005 |
| Tailwind sem component library | task-001, todas as tasks de UI |
| Islands apenas onde interativo | task-009 a task-017 |

---

## Comandos de Execução

```bash
# NÍVEL 1 — rodar em paralelo (sem dependências):
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-001  # Scaffold Fresh
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-002  # core/db.ts
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-003  # core/events.ts

# NÍVEL 2 — após nível 1 (rodar em paralelo):
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-004  # auth Google
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-005  # api/db/execute
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-006  # api/db/file
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-007  # core/report

# NÍVEL 3 — após task-004:
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-008  # auth middleware

# NÍVEL 4 — após task-008 + task-005 (rodar em paralelo):
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-009  # islands pacientes
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-010  # islands eventos
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-011  # islands dashboard
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-012  # islands report export
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-013  # route login
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-017  # Layout (independente)

# NÍVEL 5 — após nível 4 (rodar em paralelo):
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-014  # route dashboard
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-015  # route pacientes
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-016  # route eventos

# NÍVEL 6 — após todos:
claude --worktree spec-2026-06-18-migracao-fresh-deno-task-018  # Docker

# Monitorar agentes:
claude agents
```
