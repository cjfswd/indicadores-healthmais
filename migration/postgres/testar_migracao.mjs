// Testa a migracao do servidor num Postgres real, simulando um banco que ja
// esta em uso: cria coisas em `public` antes, aplica, confere que nada de la
// foi tocado, e aplica de novo para provar a idempotencia.
//
//   npm install @electric-sql/pglite
//   node testar_migracao.mjs [migracoes/001_base.sql]
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ARQ = process.argv[2] || join(AQUI, 'migracoes', '001_base.sql')

// `\set` e comando do psql, nao SQL. O arquivo o carrega para quem esquecer a
// flag na linha de comando; aqui ele sai porque quem executa nao e o psql.
const migracao = readFileSync(ARQ, 'utf8').replace(/^\\set .*$/gm, '')

const db = await PGlite.create()
const q = async (sql) => (await db.query(sql)).rows
const ok = (t) => console.log('  ' + t)
let falhas = 0
const conferir = (t, cond, detalhe) => {
  console.log('  ' + (cond ? 'ok  ' : 'FALHA ') + t + (detalhe ? ' — ' + detalhe : ''))
  if (!cond) falhas++
}

console.log((await q('SELECT version()'))[0].version.split(',')[0])

// ── Um banco que ja esta em uso ──
console.log('\n--- estado anterior: banco com coisas em public ---')
await db.exec(`
  CREATE TABLE public.clientes (id int PRIMARY KEY, nome text);
  INSERT INTO public.clientes VALUES (1, 'já existia');
  CREATE TABLE public.patients (id int PRIMARY KEY, obs text);
  INSERT INTO public.patients VALUES (1, 'homônima de propósito');
`)
ok('public tem clientes e patients (patients homônima, para provar que não colide)')

// ── Primeira aplicacao ──
console.log('\n--- primeira aplicação ---')
const t0 = Date.now()
await db.exec(migracao)
ok(`aplicada em ${Date.now() - t0}ms`)

// table_type importa: information_schema.tables conta view junto, e sao 15
// tabelas mais 2 views.
const tabelas = await q(`SELECT table_name FROM information_schema.tables
                         WHERE table_schema='painel' AND table_type='BASE TABLE'
                         ORDER BY table_name`)
const views = await q(`SELECT table_name FROM information_schema.views
                       WHERE table_schema='painel'`)
conferir('schema painel criado', tabelas.length === 15 && views.length === 2,
         tabelas.length + ' tabelas, ' + views.length + ' views')

const versoes = await q('SELECT versao, por FROM painel.migracoes')
conferir('versão registrada', versoes.length === 1 && versoes[0].versao === '001_base',
         JSON.stringify(versoes[0]))

// ── public intacto ──
console.log('\n--- public não foi tocado ---')
const cli = await q('SELECT nome FROM public.clientes')
conferir('public.clientes intacta', cli[0]?.nome === 'já existia')
const pub = await q('SELECT obs FROM public.patients')
conferir('public.patients continua a original', pub[0]?.obs === 'homônima de propósito')
const pubTabs = await q(`SELECT count(*)::int n FROM information_schema.tables
                         WHERE table_schema='public'`)
conferir('public não ganhou tabela nova', pubTabs[0].n === 2, pubTabs[0].n + ' tabelas')

// A homonima e o teste que importa: as duas convivem porque estao em schemas
// diferentes, e o SELECT sem qualificar continua indo para public.
const qual = await q(`SELECT count(*)::int n FROM painel.patients`)
conferir('painel.patients existe e é outra tabela', qual[0].n === 0)

// ── Idempotencia ──
console.log('\n--- segunda aplicação (idempotência) ---')
try {
  await db.exec(migracao)
  ok('rodou de novo sem erro')
} catch (e) {
  conferir('rodar de novo', false, String(e.message).split('\n')[0])
}
const versoes2 = await q('SELECT count(*)::int n FROM painel.migracoes')
conferir('não duplicou a versão', versoes2[0].n === 1)
const tabelas2 = await q(`SELECT count(*)::int n FROM information_schema.tables
                          WHERE table_schema='painel' AND table_type='BASE TABLE'`)
conferir('não duplicou tabela', tabelas2[0].n === 15, tabelas2[0].n + ' tabelas')

// ── Carga dentro do schema ──
const dados = process.argv[3]
if (dados) {
  console.log('\n--- carga dentro do schema ---')
  await db.exec('SET search_path TO painel;')
  await db.exec(readFileSync(dados, 'utf8'))
  const p = await q('SELECT count(*)::int n FROM painel.patients')
  const e = await q('SELECT count(*)::int n FROM painel.patient_events')
  conferir('dados entraram em painel, não em public', p[0].n === 142 && e[0].n === 206,
           p[0].n + ' pacientes, ' + e[0].n + ' eventos')
  const pubDepois = await q('SELECT count(*)::int n FROM public.patients')
  conferir('public.patients segue com 1 linha', pubDepois[0].n === 1)
}

console.log('\n' + (falhas ? falhas + ' FALHA(S)' : 'tudo certo'))
await db.close()
process.exitCode = falhas ? 1 : 0
