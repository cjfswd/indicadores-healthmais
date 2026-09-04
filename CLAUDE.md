# Notas do projeto (indicadores-healthmais)

## Novo painel
- O "novo modelo" é um protótipo de página única em
  `docs/novo-modelo/prototipo/painel.html` (HTML/CSS/JS vanilla, sem build).
  É onde o novo layout evolui: Indicadores, NPS, Certificados, Qualidade.
- Para ver com o servidor do sistema: `npm run dev` em `frontend/` e abrir
  **http://localhost:5173/painel/**. Um plugin de dev do Vite
  (`painelPrototipo`, em `frontend/vite.config.ts`, `apply: 'serve'`) serve o
  protótipo em `/painel/` — não entra no build. `/db`, `/auth` e `/painel/dados`
  passam pelo proxy para o backend em `localhost:3000`.

## Persistência / banco
- Direção: o **novo painel usa Postgres direto** para features novas (sem
  dado legado no Mongo a reconciliar). O legado ainda lê do Mongo por padrão
  (`/painel/dados`) e escreve no Mongo via `/db/execute`, com o Postgres como
  alvo de conformidade.
- Migrações Postgres: SQL numerado em `migration/postgres/migracoes/`
  (001_base, 002_nps, 003_qualidade), schema `painel`, idempotentes.
  `migration/postgres/schema.sql` é a fonte de verdade do 001 (regenerado por
  `gerar_migracao.py`); mudanças de coluna/tabela também ganham um ALTER
  numerado para bancos já implantados.
- **Qualidade** (5W2H/Ishikawa/SWOT/Kanban): persiste direto no Postgres,
  tabela `qualidade_docs` (um registro por documento, `conteudo` jsonb),
  endpoints `GET/PUT/DELETE /painel/qualidade`. `localStorage` é fallback
  offline. Spec: `docs/specs/qualidade-SDD.md`.

## Fluxo de trabalho
- SDD (spec em `docs/specs/`) → implementar → teste visual que o usuário abre
  no navegador → commit e merge por passo (PR pra `main`).
- Teste visual da Qualidade: `docs/novo-modelo/prototipo/qualidade.test.html`
  (também servido em `/painel/qualidade.test.html`).

## Segurança (pendências do usuário, não fazer sozinho)
- Repositório público já teve segredos expostos (senha Mongo, JWT, VAPID).
  Rotação e reescrita de história/force-push são decisões do usuário.
- Dados de paciente (`data.sql`, `dados.json`) nunca devem ser commitados
  publicamente nem enviados por URL pública.
