# Healthmais Indicadores — Contexto do Projeto

## Stack Alvo

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Deno |
| Framework | Fresh (islands architecture) |
| UI | Preact + Tailwind CSS (sem component library) |
| Gráficos | Chart.js (island) |
| Banco | MongoDB |
| Deploy | Docker + Coolify |

## Arquitetura Fresh/Islands

- `routes/` — cada arquivo é uma página ou endpoint de API
- `islands/` — componentes Preact interativos (Chart.js, formulários, etc.)
- `components/` — componentes Preact estáticos (sem JS no cliente)
- `static/` — assets públicos
- Sem build step — Deno compila on demand

## Regras de Código

### Islands
- Uma ilha = uma responsabilidade (ex: `DashboardChart.tsx`, `PatientForm.tsx`)
- Props tipadas com TypeScript, sem `any`
- Estado local com `useSignal` (Preact Signals) — sem estado global
- Chart.js instanciado dentro de `useEffect`, destruído no cleanup

### Rotas de API
- `routes/api/*.ts` — handlers Deno com `Handlers` do Fresh
- Validação de input com Zod em todas as rotas
- MongoDB via driver oficial Deno (`npm:mongodb`)
- Retorno sempre `Response` tipado

### Tailwind
- Sem classes de componentes — utility-first puro
- Dark mode via `class` strategy
- Sem `@apply` exceto em casos documentados

## O que NÃO fazer
- Não usar Vuetify, Pinia, TanStack Query, Vue Router — projeto migrado
- Não criar estado global entre ilhas — comunicação via URL/props/signals
- Não instalar npm packages desnecessários — Deno tem stdlib nativa
- Não usar `any` no TypeScript

## Domínio
Sistema de indicadores de saúde domiciliar:
- **Pacientes** — cadastro com admissão, operadora, eventos
- **Indicadores** — métricas com sub-indicadores (ex: AD/ID)
- **Eventos** — registros vinculados a paciente + indicador
- **Operadoras** — planos de saúde
- **Relatórios** — PDF/PPTX gerados no servidor
