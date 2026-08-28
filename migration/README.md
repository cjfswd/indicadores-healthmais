# Migração — Fase 1: inventário

Implementa a **Fase 1** do plano de corte de [`docs/novo-modelo/README.md`](../docs/novo-modelo/README.md)
(branch `claude/verificar-repositorio-novidades-98ce57`):

> Inventário: script sobre o dump gerando o de-para com contagens e a lista de casos ambíguos.

A Fase 0 (dump de produção) já está feita — o export de 28/08/2026, com 142 pacientes
e 206 eventos. O README do novo-modelo registrava que o backup versionado estava
3 meses defasado; este inventário roda sobre o dump real.

```bash
cd migration
python fase1_inventario.py --src <dir-do-export> --out <dir-fora-do-repo>
```

**As saídas contêm nome de paciente.** Grave fora do repositório.

## Resultado sobre o dump de 28/08

| Classe | Eventos | O que significa |
| --- | ---: | --- |
| `direto` | 61 (30%) | Equivalência 1:1 — o loader resolve sozinho |
| `derivacao` | 90 (44%) | Não vira fato no modelo novo; alimenta outra estrutura |
| `ambiguo` | 55 (27%) | O modelo novo pede distinção que o dado velho não tem |

O README do novo-modelo estimava **~12 ambíguos** a partir de 105 eventos. Com o dump
real são **55** — a base dobrou e a proporção subiu junto.

### De-para completo

| Antigo | Eventos | Classe | Destino |
| --- | ---: | --- | --- |
| 1.1 Alta Domiciliar | 21 | ambíguo | 1.2 ou 1.3 |
| 1.2 Admissão | 7 | direto | 1.1 Admissão |
| 2.1 Resolvidas em domicílio | 7 | ambíguo | 2.1 ou 2.2 |
| 2.2 Necessidade de Remoção APH | 6 | ambíguo | 2.3 ou 2.4 |
| 3.1 Deterioração clínica | 11 | derivação | 2.4 + causa |
| 4.2 Mais de 48h de implantação | 3 | ambíguo | 1.4 + classe 3.x |
| 5.1 ↑ PAD | 7 | direto | 4.1 Ampliação |
| 5.2 ↓ PAD | 17 | direto | 4.2 Redução |
| 6.1 AD | 63 | derivação | `episodio_cuidado.modalidade` |
| 6.2 ID | 16 | derivação | `episodio_cuidado.modalidade` |
| 7.2 >48h Pós-Antibiótico | 1 | ambíguo | 8.1–8.8 (topografia) |
| 8.2 Broncoaspiração | 1 | direto | 5.3 |
| 8.3 Lesão por pressão | 3 | ambíguo | 6.1–6.4 (estágio) |
| 8.4 Decanulação | 2 | direto | 5.4 |
| 8.5 Saída acidental da GTT | 1 | direto | 5.5 |
| 9.1 Elogios | 7 | direto | 9.4 Elogio |
| 9.3 Reclamações e Solicitações | 14 | ambíguo | 9.1 ou 9.2 (categoria extinta) |
| 9.4 Reclamações | 9 | direto | 9.1 |
| 9.5 Solicitações | 9 | direto | 9.2 |
| 10.4 Abandono/negligência | 1 | direto | 10.1 |

Onze subcategorias antigas **nunca foram usadas** (3.2, 4.1, 7.1, 8.1, 9.2, 10.1–10.3,
10.5–10.7). A ambiguidade dessas regras é teórica: não há dado para migrar.

## A coluna `pista`

O README do novo-modelo é explícito: *"Com esse volume, é revisão humana numa planilha —
não vale construir inferência."* Concordo, e o script não decide nada. Mas dá para poupar
o revisor de abrir prontuário em toda linha, cruzando o que já está no dump:

- **Remoção APH** — 5 dos 6 casos têm evento de internação (card 03) em ±2 dias. O PDF
  diz que 2.3 e 2.4 são desfechos diferentes; a internação próxima aponta 2.4.
- **Alta Domiciliar** — 8 das 21 são de pacientes que **seguem ativos**. Alta que não
  encerrou o cuidado sugere transição de nível (1.3), não objetivo alcançado (1.2).
- **Óbito** — o corte antigo é por tempo, o novo por expectativa. O tempo vira campo;
  a expectativa não existe no dado velho.

Cobertura: das 55 linhas ambíguas, 30 têm pista e 28 têm observação livre. **Só 7 ficam
sem apoio nenhum** — 4 de "Resolvidas em domicílio", 2 de "Lesão por pressão", 1 de
antibiótico.

## Sugestão de destino a partir das observações

[`sugestao.py`](sugestao.py) lê o texto livre do registro e devolve destino +
confiança + motivo. **Não decide nada**: alimenta a coluna sugerida na planilha e
a opção pré-marcada na interface.

O card 09 é o caso mais resolvível: os 14 registros de "Reclamações e
Solicitações" **têm texto, e rotulado** — a maioria começa literalmente com
`Reclamação:` ou `Solicitação:`. Resultado: 11 → 9.1, 2 → 9.2, 1 → 9.5.

Dois achados do texto que mudam o de-para:

- Um registro traz **os dois teores** ("Reclamações: … Solicitações: …"). O PDF
  manda classificar pelo de maior criticidade e lançar o resto como motivo
  adicional — implementado em `CRITICIDADE_09`.
- "Solicitação **de informações** sobre a compra da cânula" não é 9.2: no modelo
  novo é **9.5 — Dúvida ou pedido de informação**.

| Confiança | Linhas | Como é obtida |
| --- | ---: | --- |
| alta | 12 | O próprio registro rotula o teor |
| média | 2 | Palavra-chave forte no texto livre |
| baixa | 27 | Evidência indireta (situação do paciente, evento vizinho) |
| nenhuma | 14 | Nada no dado sustenta palpite |

As 14 sem sugestão são 2.1 Resolvidas em domicílio (7), 4.2 Óbito >48h (3),
8.3 Lesão por pressão (3) e 7.2 Pós-antibiótico (1) — casos onde o registro
antigo simplesmente não guardou a informação que o modelo novo exige.

## Interface de decisão

Para os casos sem texto suficiente, a planilha não basta. [`interface/`](interface)
é uma página local que mostra cada caso com a observação completa, a pista
cruzada e as opções válidas, com a sugestão já marcada e a confiança à vista.

```bash
python gerar_interface.py --src <dir-do-export> --out <dir-fora-do-repo>
python -m http.server 5175 --directory <dir-fora-do-repo>
```

Os casos vêm ordenados **do mais difícil para o mais fácil** — sem sugestão
primeiro. Tem botão para aceitar em bloco só as de confiança alta, progresso
salvo no navegador e exportação em CSV.

**Ela nunca deve ser publicada.** O `dados.json` carrega nome de paciente e
observação clínica; é para rodar em `localhost`, e por isso a saída vai para
fora do repositório.

## Arquivos

| Arquivo | Papel |
| --- | --- |
| [`catalogo_novo.py`](catalogo_novo.py) | Transcrição do PDF da recategorização + regras de de-para |
| [`sugestao.py`](sugestao.py) | Classificador das observações → sugestão + confiança |
| [`fase1_inventario.py`](fase1_inventario.py) | Script do inventário (CSV) |
| [`gerar_xlsx.py`](gerar_xlsx.py) | Planilha da Fase 2 em openpyxl, mesma paleta das exportações do painel |
| [`gerar_interface.py`](gerar_interface.py) | Monta a interface de decisão |
| `de-para.csv` | Todos os 206 eventos classificados |
| `ambiguos.csv` | 55 linhas com coluna `DECISAO` em branco |
| `card06.csv` | 79 eventos de AD/ID derivados em modalidade de episódio |
| `Migracao_Fase2.xlsx` | 5 abas, com validação por linha na coluna DECISAO |

O `Recategorizacao-dos-indicadores.pdf` é vetorizado — não tem texto extraível. O
`catalogo_novo.py` é a única forma legível por máquina do documento; se o PDF mudar,
esse arquivo muda junto.

## Próximo passo

A Fase 2 é a revisão humana de `ambiguos.csv`. Depois dela, a Fase 3 (loader idempotente)
depende das três decisões pendentes registradas no README do novo-modelo: corte do
histórico, manter ou não event sourcing, e cards 04/07 na v1.

O que existe em [`postgres/`](postgres) — ETL, validação em SQLite e teste em Postgres
real via PGlite — é o harness de carga, e vale para qualquer schema. O `schema.sql` de
lá espelha a estrutura **atual**, não a recategorização.
