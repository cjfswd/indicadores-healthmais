# Ambiente e migração

## Banco: in-memory agora é opt-in

Antes, `backend/core/database.py` decidia o banco pelo sistema operacional:

```python
is_dev = sys.platform == "win32"   # Windows → AsyncMongoMockClient()
```

Quem desenvolvia no Windows rodava sempre contra um banco em memória, zerado a
cada restart. A tela dizia "salvo com sucesso" e nada era persistido.

Agora o mock é explícito:

| Variável | Efeito |
| --- | --- |
| `MONGO_URI` | String de conexão. Se ausente ou igual a `memory`, cai no in-memory. |
| `USE_IN_MEMORY_DB=true` | Força o banco em memória, em qualquer sistema operacional. |
| `DB_NAME` | Nome do banco (padrão `coringa_db`). |

Ao subir em memória, o backend imprime um aviso explícito de que os dados somem
no restart.

Para testar localmente contra um Mongo de verdade:

```bash
cd backend
MONGO_URI="mongodb://localhost:27017" DB_NAME="coringa_db" uvicorn main:app --reload
```

## Postgres: ausente por padrão

O app vive no Mongo. O Postgres é o alvo da migração e, enquanto os dois
coexistem, **não configurar nada é um estado válido** — sem `POSTGRES_URI` o
backend sobe igual e imprime `[INFO] POSTGRES_URI ausente`.

| Variável | Para que serve |
| --- | --- |
| `POSTGRES_URI` | String de conexão. **Sem padrão**: ausente = Postgres desligado. |
| `POSTGRES_SCHEMA` | Schema onde o painel vive (padrão `painel`). |
| `POSTGRES_POOL_MAX` | Tamanho máximo do pool (padrão `10`). |

Nenhuma delas tem credencial embutida no `docker-compose.yml`. O `MONGO_URI`
tem, e é por isso que aquela senha está publicada junto do repositório — o
padrão não se repete aqui. No Coolify elas entram como variáveis do recurso.

O `search_path` é aplicado em toda conexão do pool, não uma vez no boot. O
container já tem coisas em `public`, incluindo tabelas de nome igual às nossas
(`patients`); uma consulta sem qualificação que caísse lá acertaria a tabela
errada em silêncio.

```bash
# testa o módulo de conexão contra um Postgres real, sem Docker
cd migration/postgres
node servidor_teste.mjs --com-schema &   # Postgres em memória na porta 5433
python testar_conexao.py
```

Cobre os três estados que o backend encontra: sem variável, com variável e
schema ainda não criado, e com o schema aplicado.

> No Windows o `asyncio` usa o `ProactorEventLoop`, e o `psycopg` não roda
> nele. O módulo detecta e avisa em vez de pendurar dez segundos até o timeout.
> Em produção (Linux) não acontece.

## Frontend: dados falsos agora são opt-in

`proxy-client.ts` desviava para `mock-data` sempre que `import.meta.env.DEV`
fosse verdadeiro — ou seja, em todo `npm run dev`. Nada chegava ao backend.

| Variável | Efeito |
| --- | --- |
| `VITE_USE_MOCK=true` | Usa `mock-data` e o login automático de desenvolvimento. |
| `VITE_API_URL` | URL do backend quando não está usando mock. |

```bash
# contra o backend real
VITE_API_URL=http://localhost:8000 npm run dev

# com dados falsos, sem backend
VITE_USE_MOCK=true npm run dev
```

## Migração: pacientes escondidos por alta ou óbito

Um evento de alta (`01` / `1.1`) ou óbito (`04`) disparava `SOFT_DELETE` no
paciente. Como todo `find` injeta `deletedAt: None`, o paciente inteiro sumia das
telas, junto com todos os eventos dele.

Agora esses eventos apenas marcam `inactive: True`, com motivo e data. O paciente
continua visível e ganha uma página dedicada em `/pacientes-inativos`.

Os registros já escondidos em produção precisam ser convertidos uma vez:

```bash
cd backend

# 1. confere o que seria alterado, sem gravar
MONGO_URI="mongodb://..." python migrate_inactivation.py --dry-run

# 2. aplica
MONGO_URI="mongodb://..." python migrate_inactivation.py
```

O script é idempotente e não apaga nada: a reativação entra como um evento novo
no event store (`REACTIVATE`), preservando a trilha de auditoria. Pacientes
excluídos manualmente (sem motivo de alta ou óbito) continuam excluídos.
