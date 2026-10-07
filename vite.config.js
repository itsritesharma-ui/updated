import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ownerRoutePlugin = {
  name: 'thepagecraft-owner-route',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/tpc-owner-261' || req.url === '/tpc-owner-261/') {
        res.statusCode = 302
        res.setHeader('Location', '/tpc-owner-261/index.html')
        res.end()
        return
      }
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/tpc-owner-261' || req.url === '/tpc-owner-261/') {
        res.statusCode = 302
        res.setHeader('Location', '/tpc-owner-261/index.html')
        res.end()
        return
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [ownerRoutePlugin, react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@supabase/')) return 'supabase'
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) return 'react'
          return undefined
        },
      },
    },
  },
})
