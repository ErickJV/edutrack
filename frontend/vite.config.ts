import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true, xfwd: true },
      '/_allauth': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true, xfwd: true },
      '/accounts': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true, xfwd: true },
      '/admin': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: true, xfwd: true },
    },
  },
})
