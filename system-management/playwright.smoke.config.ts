import { defineConfig } from '@playwright/test'

/**
 * Dedicated config for the real-Electron smoke spec.
 *
 * Kept separate from playwright.config.ts (browser e2e) on purpose: this suite
 * launches the built Electron binary, has no webServer, must run serially and
 * needs a much larger timeout. On headless Linux wrap the command with xvfb-run
 * (see the CI workflow and package.json `test:smoke` script).
 */
export default defineConfig({
  testDir: './src/e2e/smoke',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  timeout: 120_000,
  expect: { timeout: 30_000 },
})
