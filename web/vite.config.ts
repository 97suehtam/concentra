import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // No Windows, "localhost" fazia o Vite ouvir só no IPv6 (::1) e o Firefox, que tenta 127.0.0.1, dava timeout
  server: { host: '127.0.0.1' },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
