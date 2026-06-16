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
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
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
        // App shell + bundled content (JS/CSS/HTML/JSON/MD/fonts).
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,json,md}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Pyodide + sql.js are too large to precache, but cache-first
        // runtimeCaching keeps them available offline after the first load —
        // so the Python/SQL sandboxes work on a return visit without network.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/(pyodide\/|npm\/sql\.js).*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-runtimes',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              // status 0 allows opaque cross-origin responses to be cached.
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  optimizeDeps: {
    // Pyodide + sql.js use dynamic WASM loading; do not pre-bundle.
    exclude: ['pyodide', 'sql.js'],
  },
})
