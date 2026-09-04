import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

// Serve o painel do "novo modelo" (docs/novo-modelo/prototipo) pelo próprio
// servidor de dev do Vite, em /painel/. Assim `npm run dev` já mostra o painel
// e as mudanças, sem um servidor estático à parte: a fonte continua única no
// protótipo, e as chamadas a /db e /auth aproveitam o proxy abaixo. Só no dev
// (configureServer); não entra no build de produção.
function painelPrototipo(): Plugin {
  const dir = fileURLToPath(new URL('../docs/novo-modelo/prototipo', import.meta.url))
  const mime: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
  }
  return {
    name: 'painel-prototipo',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/painel', (req, res, next) => {
        const orig = (req.originalUrl || '').split('?')[0]
        // Sem barra final, o fetch relativo de dados.json cairia fora de
        // /painel. Redireciona para /painel/ antes de servir.
        if (orig === '/painel') {
          res.statusCode = 301
          res.setHeader('Location', '/painel/')
          return res.end()
        }
        let rel = decodeURIComponent((req.url || '/').split('?')[0])
        if (rel === '/' || rel === '') rel = '/painel.html'
        const alvo = path.join(dir, rel)
        // Nunca sair da pasta do protótipo.
        if (!alvo.startsWith(dir) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
          return next()
        }
        res.setHeader('Content-Type', mime[path.extname(alvo).toLowerCase()] || 'application/octet-stream')
        res.setHeader('Cache-Control', 'no-store')
        fs.createReadStream(alvo).pipe(res)
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
    painelPrototipo(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/db': 'http://localhost:3000',
      '/painel/dados': 'http://localhost:3000',
    }
  }
})
