import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxyTarget =
  process.env.VITE_PROXY_TARGET && process.env.VITE_PROXY_TARGET !== 'http://api:8000'
    ? process.env.VITE_PROXY_TARGET
    : 'http://host.docker.internal:8000'

export default defineConfig({
  envDir: '../',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    allowedHosts: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': { target: proxyTarget, changeOrigin: true, xfwd: true },
      '/_allauth': { target: proxyTarget, changeOrigin: true, xfwd: true },
      '/accounts': { target: proxyTarget, changeOrigin: true, xfwd: true },
      '/admin': { target: proxyTarget, changeOrigin: true, xfwd: true },
    },
  },
})
