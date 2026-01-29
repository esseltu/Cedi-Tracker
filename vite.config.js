import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Cedi-Tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['cedi-icon.svg'],
      manifest: {
        name: 'Cedi Tracker',
        short_name: 'CediTracker',
        description: 'Personal spending tracker in Ghana Cedis',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'cedi-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
