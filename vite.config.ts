import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

// PWA instalável + cache offline. Os arquivos grandes do MediaPipe (wasm/model)
// ficam em /public e entram no precache do service worker.
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Comunica',
        short_name: 'Comunica',
        description: 'Comunicação por varredura + piscada',
        theme_color: '#0b1020',
        background_color: '#0b1020',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pt-BR',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,task,wasm,data,bin}'],
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024
      }
    })
  ],
  server: { host: true }
})
