import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// Espelha o caminho FINAL do painel no dev. Em produção o Dockerfile serve o
// painel (docs/novo-modelo/prototipo/painel.html) na RAIZ como index.html e
// deixa o app Vue como legado.html. Aqui o dev faz o mesmo: `npm run dev` e
// abrir http://localhost:5173/ já mostra o painel; o Vue fica em /legado.html.
// Aplica as mesmas duas substituições do Dockerfile (client id do Google e
// caminho dos certificados), então dev e produção veem o mesmo HTML. Só no dev
// (apply: 'serve'); o build de produção continua saindo do index.html do Vue.
function painelNaRaiz(): Plugin {
  const proto = fileURLToPath(new URL('../docs/novo-modelo/prototipo', import.meta.url))
  const indexVue = fileURLToPath(new URL('./index.html', import.meta.url))
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || ''
  const transformar = (html: string) =>
    html
      .replace('<meta name="google-client-id" content="">',
        `<meta name="google-client-id" content="${clientId}">`)
      .replace('content="../../../frontend/public/certificates/"',
        'content="/certificates/"')
  return {
    name: 'painel-na-raiz',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const p = decodeURIComponent((req.url || '/').split('?')[0])
        try {
          if (p === '/' || p === '/index.html') {
            const html = transformar(fs.readFileSync(path.join(proto, 'painel.html'), 'utf8'))
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            return res.end(html)
          }
          if (p === '/dados.json') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            return fs.createReadStream(path.join(proto, 'dados.json')).pipe(res)
          }
          if (p === '/qualidade.test.html') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            return res.end(fs.readFileSync(path.join(proto, 'qualidade.test.html'), 'utf8'))
          }
          if (p === '/legado' || p === '/legado.html') {
            // App Vue (standby), com o pipeline do Vite (HMR incluso).
            const raw = fs.readFileSync(indexVue, 'utf8')
            const html = await server.transformIndexHtml('/legado.html', raw, req.originalUrl)
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            return res.end(html)
          }
        } catch (e) {
          return next(e as Error)
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: { configFile: 'src/settings.scss' }
    }),
    tailwindcss(),
    painelNaRaiz(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // Mesmas rotas que o nginx de produção manda para o backend.
    proxy: {
      '/auth': 'http://localhost:3000',
      '/db': 'http://localhost:3000',
      '/report': 'http://localhost:3000',
      '/push': 'http://localhost:3000',
      '/painel': 'http://localhost:3000',
    }
  }
})
