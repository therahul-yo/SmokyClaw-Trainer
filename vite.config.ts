import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // Pyodide + sql.js use dynamic WASM loading; do not pre-bundle.
    exclude: ['pyodide', 'sql.js'],
  },
})
