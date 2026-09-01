import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'mobile-360', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 900 } } },
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER ? undefined : {
      command: 'pnpm dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
    },
})
