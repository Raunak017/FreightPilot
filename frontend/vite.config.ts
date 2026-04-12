import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/metrics': 'http://localhost:8000',
      '/calls': 'http://localhost:8000',
    },
  },
})
