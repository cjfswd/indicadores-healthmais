// Sobe um Postgres de verdade na porta 5433, falando o protocolo de rede.
//
//   node servidor_teste.mjs [--com-schema]
//
// Existe porque nao ha Docker nesta maquina e o `psycopg` precisa de um
// servidor real para ser testado -- PGlite sozinho so fala pela API do Node.
// Com --com-schema ele ja aplica a 001_base, para cobrir os dois estados que
// o backend encontra: schema ausente e schema presente.
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const BARRA = String.fromCharCode(92)

// `\set` e comando do psql, nao SQL -- o servidor rejeita com syntax error.
// Comparar o primeiro caractere evita escrever a barra dentro de uma regex,
// que e onde isto ja quebrou uma vez: o shell comeu uma das duas barras de
// `/^\\set/` e o filtro virou "espaco em branco seguido de et", que nao casa
// com nada. A linha passava batido e o erro so aparecia no servidor.
const semMetaComandos = (sql) =>
  sql.split('\n').filter((l) => l.trimStart()[0] !== BARRA).join('\n')

const db = await PGlite.create()

if (process.argv.includes('--com-schema')) {
  await db.exec(semMetaComandos(
    readFileSync(join(AQUI, 'migracoes', '001_base.sql'), 'utf8')))
  console.log('schema painel aplicado')
}

const servidor = new PGLiteSocketServer({ db, port: 5433, host: '127.0.0.1' })
await servidor.start()
console.log('ouvindo em 127.0.0.1:5433')
