// Etapa 4 do PLANO.md: confere a carga contra os numeros da origem.
//
//   node conferir_carga.mjs /tmp/data.sql
//
// Roda as mesmas consultas que o PLANO manda rodar no servidor, mas contra um
// Postgres em memoria — para o criterio de aceite ser conferido antes de
// alguem depender dele em producao.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const dados = process.argv[2]
if (!dados) {
  console.error('uso: node conferir_carga.mjs <data.sql>')
  process.exit(1)
}

// Do dump de 2026-08-28. Se o dump mudar, estes numeros mudam junto.
const ESPERADO = {
  cards: { '01': 28, '02': 13, '03': 11, '04': 3, '05': 24,
           '06': 79, '07': 1, '08': 7, '09': 39, '10': 1 },
  situacao: { ativo: 80, inativo: 12, excluido: 50 },
  totais: { pacientes: 142, eventos: 206, auditoria: 972 },
}

const db = await PGlite.create()
// `\set` e do psql, nao SQL.
await db.exec(readFileSync(join(AQUI, 'migracoes', '001_base.sql'), 'utf8')
  .replace(/^\\set .*$/gm, ''))
await db.exec('SET search_path TO painel;')
await db.exec(readFileSync(dados, 'utf8'))

const q = async (sql) => (await db.query(sql)).rows
let falhas = 0
const conferir = (t, obtido, esperado) => {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado)
  console.log('  ' + (ok ? 'ok  ' : 'FALHA ') + t)
  if (!ok) { console.log('      esperado: ' + JSON.stringify(esperado))
             console.log('      obtido:   ' + JSON.stringify(obtido)); falhas++ }
}

console.log('--- estrutura ---')
const obj = (await q(`SELECT count(*) FILTER (WHERE table_type='BASE TABLE')::int tabelas,
                             count(*) FILTER (WHERE table_type='VIEW')::int views
                      FROM information_schema.tables WHERE table_schema='painel'`))[0]
conferir('15 tabelas e 2 views no schema painel', obj, { tabelas: 15, views: 2 })
const mig = await q('SELECT versao FROM painel.migracoes')
conferir('versao registrada', mig.map(r => r.versao), ['001_base'])

console.log('\n--- eventos por card ---')
const cards = await q(`SELECT substring(i.name from '^\\s*(\\d+)') AS card, count(*)::int AS n
                       FROM painel.patient_events e
                       JOIN painel.indicators i ON i.id = e.indicator_id
                       GROUP BY 1 ORDER BY 1`)
conferir('contagem card a card',
         Object.fromEntries(cards.map(r => [r.card, r.n])), ESPERADO.cards)

console.log('\n--- pacientes por situacao ---')
const sit = await q('SELECT situacao, count(*)::int n FROM painel.patients GROUP BY 1')
const sitObj = Object.fromEntries(sit.map(r => [r.situacao, r.n]))
conferir('80/12/50 — com a migracao de inativacao aplicada',
         { ativo: sitObj.ativo, inativo: sitObj.inativo, excluido: sitObj.excluido },
         ESPERADO.situacao)
if (sitObj.excluido === 61) {
  console.log('      → 61 excluidos significa carga SEM a migracao de inativacao')
}

console.log('\n--- totais ---')
const tot = (await q(`SELECT (SELECT count(*)::int FROM painel.patients) pacientes,
                             (SELECT count(*)::int FROM painel.patient_events) eventos,
                             (SELECT count(*)::int FROM painel.events_store) auditoria`))[0]
conferir('142 pacientes, 206 eventos, 972 na auditoria', tot, ESPERADO.totais)

console.log('\n--- origem do registro ---')
const org = await q(`SELECT origem_registro, count(*)::int n FROM painel.patient_events GROUP BY 1`)
conferir('todo o dump entra como legado',
         Object.fromEntries(org.map(r => [r.origem_registro, r.n])), { legado: 206 })

console.log('\n' + (falhas ? falhas + ' FALHA(S)' : 'carga confere com a origem'))
await db.close()
process.exitCode = falhas ? 1 : 0
