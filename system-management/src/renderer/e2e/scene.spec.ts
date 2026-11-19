import { test, expect, type Page } from '@playwright/test'

/**
 * Browser-level e2e coverage for the digital-twin view.
 *
 * The note editor is the default route, so every scene test must first open
 * the Digital Twin page. Gateway calls are stubbed at the network layer and
 * the desktop bridge is stubbed in the browser, so no backend or Electron
 * runtime is required.
 */
const JWT = 'e2e-service-account-jwt'

async function openDigitalTwin(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: /Digital Twin/i }).click()
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 })
}

test.describe('Digital Twin scene', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      // English labels keep assertions stable across the locale setting.
      localStorage.setItem('meta-note.language', 'en')
      const named: Record<string, unknown> = {
        getGatewayToken: async () => token,
        invalidateGatewayToken: async () => {},
      }
      ;(window as unknown as Record<string, unknown>).desktop = new Proxy(named, {
        get(target, property) {
          if (property in target) return target[property as string]
          return async () => null
        },
      })
    }, JWT)

    await page.route('**/factory-service/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  })

  test('renders the 3D scene canvas with non-zero size', async ({ page }) => {
    await openDigitalTwin(page)

    const box = await page.locator('canvas').boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  test('handles camera drag without page errors', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await openDigitalTwin(page)

    const box = (await page.locator('canvas').boundingBox())!
    const centerX = box.x + box.width / 2
    const centerY = box.y + box.height / 2
    await page.mouse.move(centerX, centerY)
    await page.mouse.down()
    await page.mouse.move(centerX + 100, centerY + 60, { steps: 8 })
    await page.mouse.up()

    expect(pageErrors).toEqual([])
  })

  test('shows the device list and a connection status badge', async ({ page }) => {
    await openDigitalTwin(page)

    await expect(page.getByText('Device List')).toBeVisible()
    await expect(page.getByText(/Event Sync|Realtime Connected|Service Offline/)).toBeVisible()
  })

  test('opens the alerts tab with its device alert count', async ({ page }) => {
    await openDigitalTwin(page)

    const alertsTab = page.getByRole('button', { name: /Alerts \d+/ })
    await alertsTab.click()
    await expect(alertsTab).toBeVisible()
  })
})
