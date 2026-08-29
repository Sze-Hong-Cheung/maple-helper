import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const nexonRankingProxy = {
  '/nexon-ranking': {
    target: 'https://www.nexon.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/nexon-ranking/, '/api/maplestory/no-auth/ranking/v2'),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The item catalog pulls in ~46 tiny PNGs. Inlining them as base64 would
    // bloat the main bundle by a third and none of it would be cacheable.
    assetsInlineLimit: 0,
  },
  server: { proxy: nexonRankingProxy },
  preview: { proxy: nexonRankingProxy },
})
