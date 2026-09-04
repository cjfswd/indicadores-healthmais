# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Painel (novo modelo)

O painel é servido no **caminho final**, a raiz `/`, igual à produção. Rode
`npm run dev` e abra:

    http://localhost:5173/

O app Vue (legado, em standby) fica em `http://localhost:5173/legado.html`.

Isso espelha o Dockerfile de produção, que serve `docs/novo-modelo/prototipo/painel.html`
como `index.html` na raiz e renomeia o Vue para `legado.html`. Um plugin de dev
do Vite (`painelNaRaiz`, em `vite.config.ts`, `apply: 'serve'`) faz o mesmo no
dev e aplica as mesmas substituições (client id do Google, caminho dos
certificados) — dev e produção veem o mesmo HTML. As chamadas a `/db`, `/auth`,
`/report`, `/push` e `/painel/*` passam pelo proxy para o backend em
`localhost:3000` (opcional; sem ele, o painel usa `dados.json`).
