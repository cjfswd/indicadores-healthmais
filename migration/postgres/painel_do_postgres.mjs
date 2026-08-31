// Monta o dados.json do painel a partir do Postgres, em vez do dump.
//
//   node painel_do_postgres.mjs <data.sql> [saida.json]
//
// Sobe a migracao e a carga num Postgres em memoria, roda consultas_painel.sql
// e escreve o mesmo JSON que gerar_painel_dados.py produz do dump. Se os dois
// baterem, o schema atende o painel e trocar a fonte nao muda a tela.
//
// No servidor quem executa estas mesmas consultas e a API; aqui elas rodam
// contra Postgres de verdade para provar que funcionam antes disso.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const dadosSql = process.argv[2]
const saida = process.argv[3] || join(AQUI, 'dados-do-postgres.json')
if (!dadosSql) {
  console.error('uso: node painel_do_postgres.mjs <data.sql> [saida.json]')
  process.exit(1)
}

const db = await PGlite.create()
await db.exec(readFileSync(join(AQUI, 'migracoes', '001_base.sql'), 'utf8')
  .replace(/^\\set .*$/gm, ''))
await db.exec('SET search_path TO painel;')
await db.exec(readFileSync(dadosSql, 'utf8'))

// As consultas vivem num .sql proprio para a API poder usar as mesmas.
// Mora em backend/ para entrar na imagem: a API roda estas mesmas consultas.
// Copia unica de proposito -- duas divergiriam no primeiro ajuste.
const bruto = readFileSync(join(AQUI, '..', '..', 'backend', 'consultas_painel.sql'), 'utf8')
const consultas = {}
for (const bloco of bruto.split(/^-- @/m).slice(1)) {
  const quebra = bloco.indexOf('\n')
  consultas[bloco.slice(0, quebra).trim()] = bloco.slice(quebra + 1)
}

const dados = { gerado: new Date().toISOString().slice(0, 10), competencia: '08/2026',
                fonte: 'postgres · schema painel' }
for (const [nome, sql] of Object.entries(consultas)) {
  const r = await db.query(sql)
  dados[nome] = r.rows
  console.log('  %s %s', nome.padEnd(16), String(r.rows.length).padStart(5))
}

// Pivô dos relatórios: derivado dos eventos, como a página faz.
const meses = [...new Set(dados.eventos.map(e => (e.data || '').slice(0, 7)).filter(Boolean))].sort()
dados.relatorios = { meses, linhas: [] }
for (const ind of [...new Set(dados.eventos.map(e => e.indicador))].sort()) {
  const doInd = dados.eventos.filter(e => e.indicador === ind)
  dados.relatorios.linhas.push({
    nivel: 'indicador', nome: ind, total: doInd.length,
    meses: Object.fromEntries(meses.map(m => [m, doInd.filter(e => e.data.slice(0, 7) === m).length])),
  })
}

writeFileSync(saida, JSON.stringify(dados, null, 1), 'utf8')
console.log('\nescrito: ' + saida)
await db.close()
