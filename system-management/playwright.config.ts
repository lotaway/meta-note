import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/renderer/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Browser e2e only needs the renderer; skip Electron so headless CI
    // never has to launch a real window or download its binary here.
    command: 'cross-env VITE_BROWSER_E2E=1 npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})