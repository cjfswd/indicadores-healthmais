# Plan — spec-2026-06-18-migracao-fresh-deno

**Status:** ready-for-tasks  
**Criado em:** 2026-06-18

---

## Contexto Técnico

O sistema atual tem dois runtimes separados: Python (FastAPI) para backend e Node.js (Vue 3 + Vite) para frontend. A migração consolida tudo em Deno + Fresh, eliminando Python, Vue, Vuetify, Pinia, TanStack Query e o build step do Vite.

**O MongoDB permanece intocado** — apenas o código de acesso muda de Motor (Python async) para o driver oficial MongoDB para Deno.

---

## Arquitetura Alvo

```
fresh-app/
├── deno.json               ← dependências e tasks
├── main.ts                 ← entry point
├── fresh.config.ts         ← configuração Fresh
├── routes/
│   ├── index.tsx           ← redirect para /dashboard
│   ├── login.tsx           ← página de login (SSR)
│   ├── dashboard.tsx       ← dashboard (SSR + islands)
│   ├── pacientes.tsx       ← lista de pacientes (SSR + islands)
│   ├── eventos.tsx         ← lista de eventos (SSR + islands)
│   ├── indicadores.tsx     ← lista de indicadores (SSR + islands)
│   └── api/
│       ├── auth/
│       │   └── google.ts   ← POST /api/auth/google
│       ├── db/
│       │   ├── execute.ts  ← POST /api/db/execute (find/insert/update/delete)
│       │   └── file/[collection]/[id]/[index].ts  ← GET download arquivo
│       └── report/
│           └── generate.ts ← POST /api/report/generate
├── islands/
│   ├── DashboardCharts.tsx     ← Chart.js (bar + line)
│   ├── SubindicatorCharts.tsx  ← Chart.js sub-indicadores
│   ├── PatientList.tsx         ← lista com filtros + paginação
│   ├── PatientForm.tsx         ← modal criar/editar paciente
│   ├── EventList.tsx           ← lista com filtros + paginação
│   ├── EventForm.tsx           ← modal criar/editar evento
│   ├── IndicatorList.tsx       ← lista de indicadores
│   └── ReportExport.tsx        ← botões PDF/PPTX + estado loading
├── components/
│   ├── Layout.tsx              ← nav lateral + header (estático)
│   ├── EmptyState.tsx          ← estado vazio reutilizável
│   └── ConfirmDialog.tsx       ← dialog de confirmação
└── core/
    ├── db.ts                   ← conexão MongoDB singleton
    ├── events.ts               ← append_event + materialize_snapshot
    ├── auth.ts                 ← verificar JWT middleware
    └── report.ts               ← geração PDF/PPTX
```

---

## Decisões Técnicas

### 1. Fresh como full-stack (não só frontend)

**Escolhemos Fresh/Deno** em vez de manter Python + trocar só Vue por Preact.

**Por quê:** O objetivo é um único runtime. Fresh tem rotas de API nativas (`routes/api/`) que substituem FastAPI completamente. Manter Python seria só trocar um problema (Vuetify) sem resolver o outro (dois runtimes).

### 2. Islands apenas onde há interatividade

**Escolhemos islands mínimas** em vez de SPA completa.

**Por quê:** Dashboard, pacientes, eventos — todos têm estado que muda (filtros, formulários, gráficos). SSR renderiza o shell da página; a ilha gerencia o estado interativo. Chart.js e formulários são islands; nav lateral e cabeçalho são componentes estáticos.

### 3. Manter o Event Sourcing do backend Python

**Escolhemos replicar** `append_event` + `materialize_snapshot` em TypeScript em vez de simplificar para CRUD direto.

**Por quê:** Os dados em produção são baseados nesse padrão. Mudar a lógica de escrita quebraria a consistência dos snapshots existentes e perderia o audit trail.

### 4. PDF/PPTX via `jsr:@pdf-lib/pdf-lib` + `npm:pptxgenjs`

**Escolhemos bibliotecas JS nativas** em vez de manter subprocess Python.

**Por quê:** Python como subprocess cria dependência de dois runtimes no Docker, anulando o benefício da migração. `pdf-lib` (JSR) é madura para Deno. `pptxgenjs` funciona com `npm:` imports do Deno. O layout atual é simples o suficiente para ser replicado.

**Risco:** pdf-lib tem menos recursos que ReportLab. Se surgirem limitações, o fallback é gerar HTML e usar Deno's `Deno.Command` para chamar `chromium --headless --print-to-pdf`.

### 5. Autenticação: Google OAuth2 → JWT HS256 preservado

**Escolhemos preservar** o fluxo exato: Google → `access_token` → verificar com `googleapis/v3/userinfo` → emitir JWT HS256 com `jose`.

**Por quê:** Mudar o algoritmo ou o payload invalidaria tokens ativos em localStorage dos usuários. `JWT_SECRET` continua via env var.

### 6. Comunicação entre ilhas: URL + fetch, sem estado global

**Escolhemos** fetch direto às rotas de API (`/api/db/execute`) dentro de cada ilha, sem store global.

**Por quê:** Pinia era necessário no Vue porque múltiplos componentes compartilhavam estado. Em islands architecture, cada ilha é independente. Filtros persistem via URL params; dados buscados localmente dentro de cada ilha.

### 7. Tailwind v4 com `@tailwindcss/vite` → `@tailwindcss/fresh`

**Escolhemos** o plugin oficial do Fresh para Tailwind v4.

**Por quê:** Fresh tem integração nativa com Tailwind. Sem Vuetify, toda estilização é utility-first. Estilos podem ser aprimorados sem comprometer funcionalidade.

---

## Camadas Afetadas por Critério de Aceite

| Critério | Camada | Arquivo(s) |
|---------|--------|-----------|
| Autenticação JWT | infrastructure | `core/auth.ts`, `routes/api/auth/google.ts` |
| Redirect sem JWT | infrastructure | `core/auth.ts` (middleware Fresh) |
| Dashboard cards | application + UI | `routes/dashboard.tsx`, `islands/DashboardCharts.tsx` |
| Chart.js gráficos | UI (island) | `islands/DashboardCharts.tsx`, `islands/SubindicatorCharts.tsx` |
| Filtro por data | application | lógica dentro das islands (query param) |
| Pacientes CRUD | application + infrastructure | `routes/pacientes.tsx`, `islands/PatientList.tsx`, `islands/PatientForm.tsx`, `routes/api/db/execute.ts` |
| Eventos CRUD | application + infrastructure | análogo a pacientes |
| PDF/PPTX | infrastructure | `core/report.ts`, `routes/api/report/generate.ts` |
| Event Sourcing | domain | `core/events.ts` |
| MongoDB preservado | infrastructure | `core/db.ts` |

---

## Riscos

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| `pdf-lib` não suportar layout complexo | Alta | Fallback: chromium headless via `Deno.Command` |
| Driver MongoDB para Deno menos maduro que Motor | Média | Usar `npm:mongodb` (mesmo driver Node.js, Deno suporta via npm:) |
| Chart.js em SSR (sem DOM) | Baixa | Chart.js instanciado apenas dentro de islands (client-side) |
| Dados MongoDB com ObjectId como string vs BSON | Média | Testar serialização antes de migrar; `npm:mongodb` usa BSON nativo |
| Push notifications (pywebpush → web-push) | Baixa | `npm:web-push` é equivalente direto |
| Google OAuth flow (redirect URI) | Baixa | Mesmo fluxo, apenas trocar URL base para Fresh |

---

## Tasks (para `/tasks`)

### Grupo A — Infraestrutura (sem dependências)
- **A1:** Scaffold do projeto Fresh (`deno.json`, `fresh.config.ts`, `main.ts`, Tailwind)
- **A2:** `core/db.ts` — conexão MongoDB com `npm:mongodb`, singleton, env vars
- **A3:** `core/events.ts` — `append_event` + `materialize_snapshot` portados do Python

### Grupo B — API Backend (depende de A2 + A3)
- **B1:** `routes/api/auth/google.ts` — Google OAuth2 + JWT HS256 com `jose`
- **B2:** `routes/api/db/execute.ts` — find/findOne/insert/update/delete com event sourcing
- **B3:** `routes/api/db/file/` — download de arquivo base64
- **B4:** `core/report.ts` + `routes/api/report/generate.ts` — PDF com pdf-lib, PPTX com pptxgenjs

### Grupo C — Middleware (depende de B1)
- **C1:** `core/auth.ts` — middleware JWT para proteger rotas de página e API

### Grupo D — Islands (depende de C1 + B2)
- **D1:** `islands/PatientList.tsx` + `islands/PatientForm.tsx`
- **D2:** `islands/EventList.tsx` + `islands/EventForm.tsx`
- **D3:** `islands/DashboardCharts.tsx` + `islands/SubindicatorCharts.tsx` + lógica analytics
- **D4:** `islands/ReportExport.tsx` — botões PDF/PPTX com loading state

### Grupo E — Páginas SSR (depende de C1 + D*)
- **E1:** `routes/login.tsx` — página de login com Google OAuth
- **E2:** `routes/dashboard.tsx` — shell SSR + monta islands de charts
- **E3:** `routes/pacientes.tsx` — shell SSR + monta PatientList island
- **E4:** `routes/eventos.tsx` — shell SSR + monta EventList island
- **E5:** `components/Layout.tsx` — nav lateral estático

### Grupo F — Deploy (depende de todos)
- **F1:** `Dockerfile` para Deno + `docker-compose.yml` atualizado

---

## Paralelismo de Tasks

```
A1 ──┐
A2 ──┤── B1, B2, B3 ──┐
A3 ──┘                 ├── C1 ──┬── D1, D2, D3, D4 (paralelo) ──┐
     B4 ───────────────┘        └── E1                           ├── E2, E3, E4, E5 (paralelo) ── F1
```

Tasks D1, D2, D3, D4 podem rodar em paralelo (4 worktrees).  
Tasks E2, E3, E4, E5 podem rodar em paralelo após C1 e D* concluídos.

---

## Variáveis de Ambiente (preservadas)

```env
MONGO_URI=mongodb://...
DB_NAME=mongodb-database-...
JWT_SECRET=coringa_secret_key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ALLOWED_DOMAIN=healthmaiscuidados.com
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_CLAIMS_EMAIL=...
```
