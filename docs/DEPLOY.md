# Deploy: ordem obrigatória e rollback

## A ordem importa

O backend novo entende **os dois formatos** de gravação de evento: o antigo
(`data: { events: [...] }`) e o novo (`data: { __op: "eventAppend", ... }`).
O backend antigo entende **só o antigo**.

Consequência: se o frontend novo subir antes do backend novo, o backend antigo
vai receber `{"__op": "eventAppend", "event": {...}}` e gravar `__op` e `event`
como campos soltos no documento do paciente. O evento não é salvo, e sem erro
visível — exatamente o sintoma que estamos corrigindo.

```
1. Backend  (compatível com o frontend antigo — pode subir sozinho)
2. Frontend
3. Migração (backend/migrate_inactivation.py)
```

Entre os passos 1 e 2 o sistema funciona normalmente: o frontend antigo continua
mandando o array inteiro, e o backend novo aceita.

## Migração

```bash
cd backend
MONGO_URI="mongodb://..." python migrate_inactivation.py --dry-run   # confere
MONGO_URI="mongodb://..." python migrate_inactivation.py             # aplica
```

Idempotente e não destrutiva: a reativação entra como evento `REACTIVATE` no
event store. Pacientes excluídos manualmente (sem motivo de alta ou óbito)
continuam excluídos.

Antes de rodar em produção, faça o dump de sempre:

```bash
mongodump --uri="mongodb://..." --out=backup-$(date +%F)
```

## Rollback

| Cenário | O que fazer | Risco |
| --- | --- | --- |
| Frontend com problema | Voltar só o frontend | Nenhum. O backend novo aceita o formato antigo. |
| Backend com problema, antes da migração | Voltar backend e frontend juntos | Nenhum. Nada mudou no banco. |
| Backend com problema, depois da migração | Voltar backend e frontend | Os pacientes migrados ficam com `inactive: true` e `deletedAt: None`. O código antigo ignora `inactive`, então eles reaparecem nas listas como ativos. Não há perda de dado; é só reverter a migração ou seguir com o backend novo. |

## Mudanças de comportamento (esperadas, não são bug)

- A tela de **Eventos** passa a listar eventos de pacientes inativos. É o item 2:
  antes o paciente sumia inteiro depois de uma alta.
- A tela de **Pacientes** continua mostrando só ativos por padrão, agora com um
  seletor de situação e selo de Alta/Óbito.
- `npm run dev` passa a bater no backend real. Para os dados falsos de antes:
  `VITE_USE_MOCK=true npm run dev`.

## Limitação conhecida

A edição de um evento existente resolve o índice no array a partir de uma leitura
imediatamente anterior ao `$set`. Se **outra pessoa remover um evento do mesmo
paciente entre essa leitura e a escrita** (janela de milissegundos), o `$set` pode
cair no índice deslocado. Criação e remoção são atômicas (`$push` e `$pull`) e não
têm esse problema.

Na prática a janela é muito menor que a do bug original, que perdia eventos em
qualquer gravação sequencial. Se virar problema real, o caminho é trocar o `$set`
por índice pelo `arrayFilters` do MongoDB — que o `mongomock` usado nos testes não
suporta, e por isso não foi adotado agora.
