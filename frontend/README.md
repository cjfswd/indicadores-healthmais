# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Painel (novo modelo)

O painel do novo modelo (`docs/novo-modelo/prototipo/painel.html`) é servido pelo
próprio dev server. Rode `npm run dev` e abra:

    http://localhost:5173/painel/

Não é preciso subir um servidor estático à parte — um plugin de dev do Vite
(`painelPrototipo`, em `vite.config.ts`) serve o protótipo em `/painel/` só no
dev. As chamadas a `/db`, `/auth` e `/painel/dados` passam pelo proxy para o
backend em `localhost:3000` (opcional; sem ele, o painel usa `dados.json`).
