# spec-2026-06-18-migracao-fresh-deno

**Status:** approved  
**Criado em:** 2026-06-18  
**Autor:** Antonio Carlos

---

## Contexto

O sistema atual é composto por um backend Python (FastAPI) e um frontend Vue 3 com Vuetify, Pinia e TanStack Query. Essa combinação introduz overhead desnecessário: duas linguagens, dois runtimes, um framework de componentes pesado e um build step complexo.

A migração para Fresh/Deno consolida tudo em um único runtime TypeScript, elimina a dependência de component libraries, e adota islands architecture — onde apenas partes interativas carregam JS no cliente. Esse modelo é especialmente produtivo para desenvolvimento assistido por IA, pois cada ilha tem escopo pequeno e bem definido.

---

## Usuários Afetados

- **Gestores de operadoras** — acompanham indicadores agregados e exportam relatórios
- **Equipe clínica** — registra e consulta eventos de pacientes

---

## Fora do Escopo

- Novas funcionalidades de negócio (nenhuma feature nova)
- Alterações no modelo de dados do MongoDB
- Integração com sistemas externos novos
- Mudança na lógica de autenticação (JWT preservado)

---

## Fluxo Principal

1. Usuário acessa o sistema e realiza login com e-mail e senha
2. Sistema autentica via JWT e redireciona para o dashboard
3. Dashboard exibe cards de indicadores, gráficos de barra, gráfico de linha e tabela mensal
4. Usuário navega para gestão de pacientes, indicadores, eventos ou operadoras
5. Usuário realiza operações CRUD em cada entidade
6. Usuário exporta relatório em PDF ou PPTX a partir do dashboard

---

## Fluxos Alternativos

- **Login inválido:** sistema exibe mensagem de erro, não redireciona
- **Token expirado:** sistema redireciona para login automaticamente
- **Sem dados:** dashboard exibe estado vazio com mensagem clara
- **Falha na exportação:** sistema exibe notificação de erro sem travar a página

---

## Critérios de Aceite (EARS)

### Autenticação
- `O sistema SHALL autenticar o usuário com e-mail e senha WHEN a rota /login receber credenciais válidas`
- `O sistema SHALL redirecionar para /login WHEN uma rota protegida for acessada sem JWT válido`
- `O sistema SHALL NOT permitir acesso a rotas de API WHEN o JWT estiver ausente ou expirado`

### Dashboard
- `O sistema SHALL exibir cards com total de eventos por indicador WHEN o dashboard for carregado`
- `O sistema SHALL exibir gráfico de barras por indicador usando Chart.js WHEN houver dados no período`
- `O sistema SHALL exibir gráfico de linha com evolução mensal WHEN houver dados no período`
- `O sistema SHALL exibir tabela pivot por mês WHEN houver dados no ano corrente`
- `O sistema SHALL filtrar todos os dados por intervalo de datas WHEN o usuário selecionar data inicial e/ou final`
- `O sistema SHALL exibir estado vazio com ícone e mensagem WHEN não houver eventos no período`

### Pacientes
- `O sistema SHALL listar pacientes paginados (10 por página) WHEN a rota /pacientes for acessada`
- `O sistema SHALL filtrar pacientes por nome e operadora WHEN o usuário preencher os campos de busca`
- `O sistema SHALL criar, editar e excluir pacientes WHEN o usuário submeter os formulários correspondentes`
- `O sistema SHALL confirmar exclusão antes de remover WHEN o usuário clicar em excluir`

### Indicadores e Eventos
- `O sistema SHALL listar indicadores com seus sub-indicadores WHEN a rota /indicadores for acessada`
- `O sistema SHALL registrar eventos vinculados a paciente e indicador WHEN o formulário for submetido com dados válidos`
- `O sistema SHALL filtrar eventos por paciente, indicador e sub-indicador WHEN os filtros forem aplicados`

### Relatórios
- `O sistema SHALL gerar e baixar PDF do relatório WHEN o usuário clicar em "Exportar PDF"`
- `O sistema SHALL gerar e baixar PPTX do relatório WHEN o usuário clicar em "Exportar PPTX"`
- `O sistema SHALL incluir imagens dos gráficos no relatório WHEN os gráficos estiverem renderizados`

### Stack e Arquitetura
- `O sistema SHALL rodar inteiramente em Deno sem dependência de Node.js ou Python WHEN em produção`
- `O sistema SHALL preservar todos os dados existentes no MongoDB WHEN a migração for concluída`
- `O sistema SHALL usar Tailwind CSS sem component library WHEN renderizar qualquer página`
- `O sistema SHALL usar islands Preact apenas para componentes interativos WHEN houver interatividade necessária`

---

## Dependências

- Nenhuma spec anterior — este é o projeto base
- MongoDB existente com dados de produção deve ser acessível pelo novo backend Deno

---

## Notas Técnicas

- JWT: preservar algoritmo e secret atuais para não invalidar sessões ativas
- Chart.js: instanciar dentro de islands com cleanup em `useEffect`
- Exportação PDF/PPTX: manter endpoint `/report/generate` compatível com payload atual
- Estilos: Tailwind puro, melhorias de UI/UX são bem-vindas desde que não quebrem fluxos existentes
