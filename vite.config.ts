import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'SmokyClaw Trainer',
        short_name: 'SmokyClaw',
        description:
          'Local-first trainer for TCS NQT / Infosys / Wipro / Capgemini hiring tests — Python, DSA, SQL, Aptitude. No signup, runs in your browser.',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell + bundled content (JS/CSS/HTML/JSON/MD/fonts). Pyodide &
        // sql.js load from a CDN at runtime and are intentionally not precached.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,json,md}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  optimizeDeps: {
    // Pyodide + sql.js use dynamic WASM loading; do not pre-bundle.
    exclude: ['pyodide', 'sql.js'],
  },
})
