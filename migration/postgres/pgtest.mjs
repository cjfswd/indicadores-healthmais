// Valida schema.sql + a carga num Postgres real, em memoria, sem servidor.
//
//   npm install @electric-sql/pglite
//   node pgtest.mjs <caminho-do-data.sql>
//
// PGlite roda o Postgres compilado em WASM. E o unico teste aqui que exercita
// dialeto de verdade: jsonb, date, timestamptz e o comportamento da sequence do
// bigserial -- foi assim que apareceu o setval que faltava na carga.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const dataPath = process.argv[2]
if (!dataPath) {
  console.error('uso: node pgtest.mjs <caminho-do-data.sql>')
  process.exit(1)
}

const schema = readFileSync(join(AQUI, 'schema.sql'), 'utf8')
const dados = readFileSync(dataPath, 'utf8')

const db = await PGlite.create()
const q = async (sql) => (await db.query(sql)).rows

console.log((await q('SELECT version()'))[0].version.split(',')[0])

await db.exec(schema)
console.log('\nschema.sql aplicado, sem erro de dialeto')

const t0 = Date.now()
await db.exec(dados)
console.log(`carga aplicada em ${Date.now() - t0}ms`)

console.log('\n--- contagens ---')
const TABELAS = ['operators', 'users', 'indicators', 'subindicators', 'patients',
  'patient_events', 'notifications', 'social_assistance_reports', 'events_store']
for (const t of TABELAS) {
  const r = await q(`SELECT count(*)::int AS n FROM ${t}`)
  console.log(`  ${t.padEnd(28)} ${String(r[0].n).padStart(5)}`)
}

console.log('\n--- indicadores na estrutura relacional nova ---')
let somaEventos = 0
for (const r of await q(`
    SELECT i.name,
           count(DISTINCT s.id)::int AS subs,
           count(DISTINCT e.id)::int AS eventos
    FROM indicators i
    LEFT JOIN subindicators s  ON s.indicator_id = i.id
    LEFT JOIN patient_events e ON e.indicator_id = i.id
    GROUP BY i.id, i.name ORDER BY i.name`)) {
  somaEventos += r.eventos
  console.log(`  ${r.name.slice(0, 40).padEnd(42)} subs=${String(r.subs).padStart(2)}  eventos=${String(r.eventos).padStart(3)}`)
}
const totalEventos = (await q('SELECT count(*)::int AS n FROM patient_events'))[0].n
console.log(`  ${''.padEnd(42)} soma=${somaEventos} / total=${totalEventos} ${somaEventos === totalEventos ? 'OK' : 'DIVERGE'}`)

console.log('\n--- jsonb (operadores mongo preservados no event store) ---')
for (const r of await q(`
    SELECT event_type, count(*)::int AS n,
           count(*) FILTER (WHERE data ? '$push')::int AS com_push,
           count(*) FILTER (WHERE data ? '$set')::int  AS com_set
    FROM events_store GROUP BY event_type ORDER BY 2 DESC`)) {
  console.log(`  ${r.event_type.padEnd(14)} n=${String(r.n).padStart(3)}  $push=${r.com_push}  $set=${r.com_set}`)
}

console.log('\n--- pacientes por situacao ---')
for (const r of await q(`
    SELECT CASE WHEN deleted_at IS NOT NULL THEN 'excluidos'
                WHEN inactive THEN 'inativos' ELSE 'ativos' END AS s,
           count(*)::int AS n
    FROM patients GROUP BY s ORDER BY n DESC`)) {
  console.log(`  ${r.s.padEnd(12)} ${String(r.n).padStart(3)}`)
}

console.log('\n--- sequence do bigserial ---')
const seq = (await q('SELECT last_value, is_called FROM subindicators_id_seq'))[0]
const maxid = (await q('SELECT max(id) AS m FROM subindicators'))[0]
console.log(`  sequence=${seq.last_value} is_called=${seq.is_called} max(id)=${maxid.m}`)
try {
  await db.exec(`INSERT INTO subindicators (indicator_id, position, name)
                 SELECT id, 99, 'teste-sequence' FROM indicators LIMIT 1`)
  console.log('  INSERT sem id explicito: OK')
} catch (e) {
  console.log(`  INSERT sem id explicito FALHOU: ${String(e.message).split('\n')[0]}`)
  process.exitCode = 1
}

await db.close()
