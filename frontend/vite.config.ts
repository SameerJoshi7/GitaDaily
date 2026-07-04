/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      includeAssets: ['flute-icon.png', 'flute-icon-maskable.png'],
      manifest: {
        name: 'Krishna Bodha',
        short_name: 'KrishnaBodha',
        description: 'Receive Bhagavad Gita shlokas and AI-powered reflections for modern life, career, and mental well-being.',
        theme_color: '#050508',
        background_color: '#050508',
        display: 'standalone',
        icons: [
          {
            src: 'flute-icon.png',
            sizes: '192x192 512x512',
            type: 'image/png'
          },
          {
            src: 'flute-icon-maskable.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    port: 5176,
    strictPort: true
  }
})
