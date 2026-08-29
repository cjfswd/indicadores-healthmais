# Plano — levar os dados para o container Postgres

Estado hoje: o schema, a carga e as consultas estão prontos e validados contra
PostgreSQL 18.3. O que não existe é **qualquer ligação com o container real** —
o repositório não tem string de conexão, variável de ambiente nem driver
Postgres no backend (`requirements.txt` só tem `motor`, que é Mongo).

Este é o caminho da bancada até o servidor, em cinco etapas. As três primeiras
são de infra e rodam uma vez; as duas últimas são o que faz o painel deixar de
ler arquivo.

---

## Etapa 1 — Descobrir o container e as credenciais

O Postgres do Coolify tem hostname interno com UUID, como o Mongo
(`ac4ljene7dzemo5naoldrcmv`). Ele **só resolve dentro da rede do Coolify** —
de fora não há DNS para esse nome.

No terminal do recurso Postgres, no painel do Coolify:

```bash
env | grep -i postgres
```

Isso devolve `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`.

> **Não copie a senha para lugar nenhum.** Foi exatamente isso que travou o
> backup do Mongo por três tentativas: a senha estava certa, a cópia é que
> vinha incompleta. Use `"$POSTGRES_PASSWORD"` direto nos comandos.

Confirme que autentica antes de qualquer outra coisa:

```bash
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();"
```

E veja o que já existe lá dentro, para saber com o que vai conviver:

```bash
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dn"
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt public.*"
```

**Critério de saída:** você tem usuário, senha e banco, e sabe quais schemas e
tabelas já existem.

---

## Etapa 2 — Aplicar a migração

```bash
python gerar_migracao.py                    # regenera a partir dos schemas
```

O arquivo vai para o container. Pelo host do Coolify:

```bash
docker cp migracoes/001_base.sql CONTAINER:/tmp/001_base.sql
docker exec CONTAINER sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/001_base.sql'
```

`ON_ERROR_STOP=1` não é detalhe: sem ele o `psql` segue depois de um erro e
você termina com meia migração e nenhum aviso.

Confira:

```sql
SELECT * FROM painel.migracoes;
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'painel';
```

Esperado: uma linha `001_base`, 15 tabelas e 2 views.

**Por que schema próprio:** o banco já tem coisas em `public`, e os nomes do
painel são genéricos — `patients`, `users`, `notifications`. `painel.patients`
e `public.patients` convivem sem se ver; foi assim que o teste em
`testar_migracao.mjs` provou.

**Critério de saída:** `painel.migracoes` tem a linha, e `public` tem
exatamente as mesmas tabelas de antes.

---

## Etapa 3 — Carregar o dump

```bash
python etl.py --src <dir-do-export> --out /tmp/data.sql
```

O `data.sql` **carrega nome de paciente e observação clínica**. Ele não entra
no repositório, não vai por e-mail e não fica no servidor depois da carga.

```bash
docker cp /tmp/data.sql CONTAINER:/tmp/data.sql
docker exec CONTAINER sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "SET search_path TO painel;" -f /tmp/data.sql'
docker exec CONTAINER rm /tmp/data.sql /tmp/001_base.sql
```

O `SET search_path` importa: sem ele os `INSERT` sem qualificação procuram
`public` e falham — ou pior, acertam a tabela errada se houver homônima.

**Critério de saída:** 142 pacientes, 206 eventos, 972 entradas de auditoria
dentro de `painel`, e `/tmp` limpo.

---

## Etapa 4 — Conferir contra a origem

É o teste de aceite da Fase 4 do plano de corte. Os números do Postgres têm
que bater com os do Mongo, card a card:

```sql
SELECT substring(i.name from '^\s*(\d+)') AS card,
       count(*)::int AS eventos
FROM painel.patient_events e
JOIN painel.indicators i ON i.id = e.indicator_id
GROUP BY 1 ORDER BY 1;
```

Esperado, do dump de 28/08:

| Card | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Eventos | 28 | 13 | 11 | 3 | 24 | 79 | 1 | 7 | 39 | 1 |

E a situação dos pacientes:

```sql
SELECT situacao, count(*) FROM painel.patients GROUP BY 1;
```

Esperado **80 ativos, 12 inativos, 50 excluídos** — não 61 excluídos. A
diferença é a migração de inativação, aplicada na carga. Se vier 61/1, a carga
rodou sem ela.

Os números acima não são estimativa: `conferir_carga.mjs` roda exatamente
estas consultas contra um Postgres em memória, e passa.

```bash
node conferir_carga.mjs /tmp/data.sql
```

Vale rodar **antes** de ir ao servidor — se falhar aqui, falha lá, e é mais
barato descobrir na bancada. O script também avisa o caso específico de 61
excluídos, que significa carga sem a migração de inativação.

**Critério de saída:** as duas consultas batem com a tabela acima.

---

## Etapa 5 — O painel lendo do banco

Aqui muda a natureza do trabalho: as quatro etapas acima são operação, esta é
desenvolvimento.

O painel é HTML estático e busca `dados.json` ao lado. Para ler do Postgres
ele precisa de alguém que execute as consultas — e esse alguém não existe.

Duas saídas, em ordem de esforço:

### 5a. Geração agendada (menor passo, funciona amanhã)

Um script roda no servidor, executa `consultas_painel.sql` e escreve o
`dados.json` onde o painel o busca. O painel não muda nem uma linha.

- **A favor:** o painel já lê esse arquivo; as consultas já estão validadas.
- **Contra:** o dado é do último ciclo, não do instante. E não resolve
  escrita — o formulário continua sem para onde gravar.
- **Precisa de:** `psycopg` no `requirements.txt` (hoje não há driver
  Postgres nenhum), um cron, e um caminho de escrita servido pelo nginx.

### 5b. API de leitura (o caminho de verdade)

Endpoints no backend que rodam as mesmas consultas e devolvem JSON. O painel
troca `fetch('dados.json')` por `fetch('/api/painel')`.

- **A favor:** dado do instante, e é a base sobre a qual a escrita entra
  depois — que é o que os `CHECK` de `origem_registro = 'sistema'` esperam.
- **Contra:** é código novo no backend, que hoje fala só Mongo.
- **Precisa de:** `psycopg`, um router novo, `POSTGRES_URI` no
  `docker-compose.yml` e nas variáveis do Coolify.

**Recomendação:** 5b. O 5a parece mais barato mas é um degrau que se joga
fora, e não destrava a escrita — que é para onde isto está indo.

---

## O que pode dar errado

**A senha copiada errada.** Aconteceu com o Mongo, três vezes. Use
`"$POSTGRES_PASSWORD"`, nunca a cópia.

**O hostname não resolver.** O UUID do Coolify só existe dentro da rede dele.
De fora, ou é o IP público com a porta exposta, ou nada.

**O `search_path` esquecido.** A carga vai para `public` e ninguém percebe até
alguém consultar `painel.patients` e achar vazio.

**Fuso do servidor.** As consultas já forçam `AT TIME ZONE 'UTC'` em todo
`to_char` de timestamp — sem isso o mesmo banco daria datas diferentes conforme
o fuso da sessão. Se aparecer data com um dia de diferença, é aqui.

**O dado de paciente ficar onde não devia.** O `data.sql` sai do servidor
depois da carga. Ele nunca entra no repositório: o `.gitignore` cobre, mas a
disciplina é o que vale.

---

## Resumo

| Etapa | O quê | Onde roda | Bloqueia? |
| --- | --- | --- | --- |
| 1 | Credenciais e estado atual | Terminal do Coolify | — |
| 2 | `001_base.sql` no schema `painel` | Container | Etapa 1 |
| 3 | `data.sql` com o dump | Container | Etapa 2 |
| 4 | Conferência card a card | Container | Etapa 3 |
| 5 | Painel lendo do banco | Backend | Etapa 4 |

As etapas 1 a 4 são executáveis hoje e não dependem de decisão nenhuma. A 5
depende de escolher entre 5a e 5b, e é a única que exige código novo.
