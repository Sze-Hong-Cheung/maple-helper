import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rosterDbFile = path.resolve('src/roster/db.json')

function rosterDbPlugin() {
  return {
    name: 'roster-db-file',
    configureServer(server) {
      server.middlewares.use('/__roster-db', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(fs.readFileSync(rosterDbFile, 'utf8'))
          return
        }
        if (req.method !== 'PUT' && req.method !== 'POST') {
          next()
          return
        }

        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (!Array.isArray(body?.characters)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'characters must be an array' }))
              return
            }
            fs.writeFileSync(rosterDbFile, `${JSON.stringify({ characters: body.characters }, null, 2)}\n`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (error) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'invalid json' }))
          }
        })
      })
    },
  }
}

const nexonRankingProxy = {
  '/nexon-ranking': {
    target: 'https://www.nexon.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/nexon-ranking/, '/api/maplestory/no-auth/ranking/v2'),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rosterDbPlugin()],
  build: {
    // The item catalog pulls in ~46 tiny PNGs. Inlining them as base64 would
    // bloat the main bundle by a third and none of it would be cacheable.
    assetsInlineLimit: 0,
  },
  server: {
    proxy: nexonRankingProxy,
    watch: {
      ignored: ['**/src/roster/db.json'],
    },
  },
  preview: { proxy: nexonRankingProxy },
})
