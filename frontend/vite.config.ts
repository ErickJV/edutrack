import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

export default defineConfig({
  envDir: '../',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true, xfwd: true },
      '/_allauth': { target: proxyTarget, changeOrigin: true, xfwd: true },
      '/accounts': { target: proxyTarget, changeOrigin: true, xfwd: true },
      '/admin': { target: proxyTarget, changeOrigin: true, xfwd: true },
    },
  },
})
