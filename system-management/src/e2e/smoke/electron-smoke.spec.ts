import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test'
import path from 'node:path'

/**
 * Real Electron runtime smoke test.
 *
 * Unlike the browser e2e suite (which runs against the Vite dev server in
 * headless Chromium with a mocked window.desktop), this spec launches the
 * actual Electron binary against the built main process and loads the built
 * renderer. It is the only check that proves the three things unit tests and
 * browser e2e cannot:
 *   1. the packaged main process starts and opens a real BrowserWindow;
 *   2. the preload bridge exposes the named window.desktop API;
 *   3. the NAPI-RS native module loads under Electron's ABI (rust-bridge logs
 *      a "[NativeBridge] CRITICAL" line only when require() fails).
 *
 * Prerequisites: `npm run build` and `npm run build:native` must have produced
 * dist-electron/main/desktop-main.js, dist/index.html and native/index.node.
 * On headless Linux this spec must be wrapped with `xvfb-run`.
 */

const MAIN_ENTRY = path.resolve(process.cwd(), 'dist-electron/main/desktop-main.js')
const NATIVE_FAILURE_MARKER = '[NativeBridge] CRITICAL'

function collectMainOutput(app: ElectronApplication): () => string {
  const lines: string[] = []
  const capture = (chunk: Buffer | string) => lines.push(String(chunk))
  app.process()?.stdout?.on('data', capture)
  app.process()?.stderr?.on('data', capture)
  return () => lines.join('')
}

test.describe('Electron runtime smoke', () => {
  test('opens the real app with UI, bridge and native module loaded', async () => {
    const app = await electron.launch({
      args: [MAIN_ENTRY],
      env: { ...process.env, NODE_ENV: 'production' },
      timeout: 60_000,
    })
    const readOutput = collectMainOutput(app)

    try {
      const appWindow = await app.firstWindow({ timeout: 60_000 })
      await appWindow.waitForLoadState('domcontentloaded')

      const bridgeMethods = await appWindow.evaluate(() => {
        const api = (window as unknown as { desktop?: Record<string, unknown> }).desktop
        if (!api) return []
        return Object.keys(api).filter(key => typeof api[key] === 'function')
      })
      expect(bridgeMethods, 'window.desktop named bridge must be exposed by preload')
        .toContain('getGatewayToken')
      expect(bridgeMethods).toContain('getLocalApiToken')
      expect(bridgeMethods).toContain('openExternal')

      await expect(appWindow.locator('#app'), 'real business UI must render into #app')
        .not.toBeEmpty({ timeout: 30_000 })

      expect(readOutput(), 'NAPI-RS native module must load under Electron ABI')
        .not.toContain(NATIVE_FAILURE_MARKER)
    } finally {
      await app.close()
    }
  })
})
