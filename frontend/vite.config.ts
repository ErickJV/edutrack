import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

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
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
    globals: true,
  },
})
