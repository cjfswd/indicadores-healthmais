# SDD — Ferramentas da qualidade (5W2H · Ishikawa · SWOT · Kanban)

Spec-driven: esta é a especificação. O desenvolvimento a segue; se algo mudar
no código, muda aqui antes.

## 1. Problema e objetivo

O painel registra eventos (quedas, eventos adversos, detratores do NPS) mas não
tem onde **analisar a causa** nem **planejar a ação** sobre eles. Hoje isso vive
fora do sistema (planilha, papel). O objetivo é trazer quatro ferramentas
clássicas da qualidade para dentro do painel, no **mesmo layout** das demais
páginas (Indicadores, NPS, Certificados), não num arquivo à parte.

Não-objetivo (deste passo): persistência no banco e vínculo formal a cada
evento. Fica especificado na seção 6 para o passo seguinte.

## 2. Onde vive (conformidade com o sistema atual)

É uma **página de Operação**, como Certificados e Relatórios:

- entra em `PAGES` como `qualidade`;
- renderiza por `ESPECIAIS.qualidade = opQualidade`, no container `#pageLegacy`
  (`#opTitulo`, `#opLead`, `#opStats`, e um wrap próprio inserido antes do
  `#legacyBody`), exatamente como `opCertificadosNovo`;
- reusa os componentes e tokens já existentes (`sec-h`, `cell`, `btn`,
  `combobox`, `.fld`, cores `--done/--flag/--sev-2/--accent`);
- é limpa ao trocar de página pelo mesmo mecanismo (lista de ids a remover).

O arquivo `prototipo/qualidade.html` (rascunho separado) é **removido** — foi só
para mostrar o formato, e o lugar certo é dentro do painel.

## 3. Estrutura da página

Cabeçalho padrão de Operação + uma barra de abas interna (como as abas de
Tabela/Board/Evolução dos cards): **5W2H · Ishikawa · SWOT · Kanban**.

Um seletor de **caso em análise** no topo: por ora, um caso livre (título +
descrição), semeado com um detrator do NPS. No passo de banco, vira um vínculo
a um evento real.

### 3.1 5W2H
Tabela com sete colunas — What/O quê, Why/Por quê, Where/Onde, When/Quando,
Who/Quem, How/Como, How much/Quanto. Linhas adicionáveis e removíveis; cada
célula é um campo editável. É o plano de ação.

### 3.2 Ishikawa (espinha de peixe)
SVG: efeito na cabeça à direita, espinha central, seis ramos com os 6 M
(Método, Máquina, Material, Mão de obra, Medição, Meio ambiente). As causas de
cada M são editadas numa grade abaixo; editar redesenha o diagrama.

### 3.3 SWOT
Quatro quadrantes — Forças, Fraquezas (internas) e Oportunidades, Ameaças
(externas). Itens editáveis por quadrante, borda colorida por natureza.

### 3.4 Kanban
Colunas Backlog · A fazer · Fazendo · Feito. Cartões com título, responsável e
prioridade (alta/média/baixa). Mover por arrastar entre colunas; contador por
coluna; adicionar/remover cartão. As ações do 5W2H podem virar cartões.

## 4. Estado e persistência (este passo)

### 4.1 Vários documentos, identificáveis
Cada ferramenta guarda **uma lista de documentos**, não um só. Cada documento
tem `id`, `titulo` (como a pessoa o identifica no sistema) e `criadoEm`. Cada
aba mostra um seletor de documento (escolher / criar / renomear / excluir) e,
abaixo, o editor do documento escolhido.

Por empresa (`F.emp`), em `localStorage`:

```
qualidade[empresa] = {
  w2h:      [ {id, titulo, criadoEm, linhas:[{id, oque,porque,onde,quando,quem,como,quanto}]} ],
  ishikawa: [ {id, titulo, criadoEm, efeito, categorias:[{id, nome, causas:[{id, texto}]}]} ],
  swot:     [ {id, titulo, criadoEm, forcas:[{id,texto}], fraquezas:[...], oportunidades:[...], ameacas:[...]} ],
  kanban:   [ {id, titulo, criadoEm, cartoes:[
                {id, tit, col, resp, prio, estimativa, concluidoEm, historico:[{col, em}]} ]} ],
}
```

Migração: o formato antigo (documento único por ferramenta) é convertido para
uma lista de um documento na primeira carga.

### 4.2 Categorias do Ishikawa editáveis
As categorias (os 6 M — Método, Máquina, Material, Mão de obra, Medição, Meio
ambiente) deixam de ser fixas: são uma lista `categorias[]` que a pessoa pode
**criar, renomear, remover e reordenar**. O novo documento nasce com os 6 M
como ponto de partida.

### 4.3 Reordenar itens
Toda lista permite mover item para cima/baixo (setas ↑/↓): linhas do 5W2H,
causas e categorias do Ishikawa, itens do SWOT, e cartões do Kanban dentro da
coluna. O Kanban também move entre colunas por arrastar.

### 4.4 Datas no Kanban
Cada cartão tem `estimativa` (data prevista de conclusão), `concluidoEm`
(preenchida ao entrar em "Feito", limpa ao sair) e `historico` — a data de
entrada em cada coluna, registrada a cada movimentação. O cartão mostra a
estimativa e sinaliza atraso (estimativa vencida e não concluído).

## 4.5 Exportação A4
O Ishikawa é exportável para folha A4 (impressão / PDF), como os demais itens
do sistema: um botão abre uma janela de impressão com o diagrama e o título
dimensionados para A4 paisagem e chama `print()`. O 5W2H e o SWOT também ganham
exportação A4 (tabela e quadrantes).

## 4.6 UX/UI no mesmo idioma do painel (inspiração Notion)

A área reusa os componentes do restante do novo layout, em vez de inventar os
próprios, para ler como os módulos de Indicadores, NPS e Certificados:

- **Abas** com o mesmo componente das visões (`.views`/`.tab`), com um contador
  discreto por ferramenta (nº de documentos).
- **Estatísticas** do documento nas células padrão (`#opStats` → `.split`/
  `.cell`): 5W2H (ações · definidas · responsáveis); Ishikawa (categorias ·
  causas); SWOT (itens por eixo); Kanban (cartões · concluídos · atrasados ·
  % concluído). Espelham o cabeçalho das demais páginas.
- **Cabeçalho do documento à la Notion**: o título é um campo editável em
  destaque (não um input numa barra cinza); a troca entre documentos usa o
  `combobox` do painel (aparece a partir de 2 documentos); "Excluir" é
  secundário e "+ Novo" é primário.
- **Estado vazio** com alvo claro e ação ("Nenhum … ainda. Crie o primeiro").
- **SWOT** sem faixa colorida na borda: cada quadrante é rotulado por um ponto
  colorido no título (mesmo vocabulário dos marcadores do painel).
- **5W2H**: os campos crescem com o conteúdo e, ao crescer um, os demais da
  mesma linha acompanham a altura, mantendo a linha alinhada.
- Tudo tematizado por tokens (claro/escuro) — nenhuma cor fixa nova.

## 5. Critérios de aceitação

- A página abre pelo menu de Operação, no mesmo layout das demais (título,
  lead, rodapé "o que muda"), sem arquivo externo.
- As quatro abas trocam sem recarregar; cada uma renderiza sua ferramenta.
- 5W2H: adicionar/remover/editar linha persiste.
- Ishikawa: adicionar/editar/remover causa redesenha o SVG; o efeito aparece na
  cabeça.
- SWOT: adicionar/editar/remover item por quadrante persiste.
- Kanban: arrastar cartão entre colunas persiste; contador acompanha.
- Trocar de empresa troca o plano; trocar de página limpa o wrap injetado.
- Sem erros no console; verificado no navegador.

## 6. Persistência online (implementado)

A Qualidade grava **direto no Postgres** (feature nova do novo painel; não há
dado legado no Mongo a reconciliar), com o `localStorage` como cópia local e
fallback offline.

**Modelo — um registro por documento** (`migration/postgres/migracoes/003_qualidade.sql`,
também em `schema.sql`):

```
qualidade_docs (id PK, empresa, tipo CHECK(w2h|ishikawa|swot|kanban),
                titulo, criado_em, conteudo jsonb, atualizado_em, atualizado_por)
índice: (empresa, tipo, criado_em DESC, id)
```

O corpo específico de cada ferramenta (linhas / efeito+categorias / quadrantes /
cartões) fica em `conteudo` (jsonb), porque o formato difere entre elas e evolui
na tela; título, tipo e datas ficam em colunas para listar e ordenar. Escolheu-se
o blob jsonb em vez de tabelas relacionais por ferramenta pelo mesmo motivo do
NPS: a forma nasce e muda na tela, e um esquema rígido por ferramenta obrigaria
uma migração a cada ajuste de campo.

**Endpoints** (`backend/routers/painel.py`, exigem sessão + Postgres):
- `GET /painel/qualidade?empresa=` → `{w2h:[...], ishikawa:[...], swot:[...], kanban:[...]}`
- `PUT /painel/qualidade/{id}` corpo `{empresa, tipo, doc}` → upsert
- `DELETE /painel/qualidade/{id}?empresa=` → remove

**Tela** (`painel.html`): ao abrir a Qualidade com sessão, puxa do servidor e
redesenha (`qldCarregar`); cada edição salva o documento em foco com debounce
(`qldSincronizar` via `PUT`); excluir chama `DELETE`. Sem sessão ou sem Postgres,
tudo continua no `localStorage`. Aplicar: `psql … -f 003_qualidade.sql` depois do
001; num banco criado do `schema.sql` regenerado, a tabela já vem do 001.
