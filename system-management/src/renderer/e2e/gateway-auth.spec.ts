import { test, expect } from '@playwright/test'

/**
 * Browser-level e2e coverage for the gateway-only boundary.
 *
 * The Vite dev server serves the real TypeScript modules, so these tests
 * exercise the actual gateway-client.ts (URL construction, bearer header,
 * WebSocket token, 401 invalidation) with a real Chromium fetch, while the
 * gateway itself is stubbed at the network layer. No backend is required.
 */
const JWT = 'e2e-service-account-jwt'
const DEVICES_PATH = '/api/digital-twin/devices'
const CLIENT_MODULE = '/src/renderer/services/gateway-client.ts'

interface CapturedRequest {
  url: string
  authorization?: string
}

let captured: CapturedRequest[] = []
let failFirstDevicesRequest = false
let firstRequestFailed = false
const allUrls: string[] = []

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page }) => {
  captured = []
  failFirstDevicesRequest = false
  firstRequestFailed = false
  allUrls.length = 0

  await page.addInitScript((token) => {
    const state = { invalidations: 0 }
    ;(window as unknown as Record<string, unknown>).__gatewayAuthState = state
    const named: Record<string, unknown> = {
      getGatewayToken: async () => token,
      invalidateGatewayToken: async () => { state.invalidations += 1 },
    }
    // The rest of the app may call other named bridge methods during startup.
    ;(window as unknown as Record<string, unknown>).desktop = new Proxy(named, {
      get(target, property) {
        if (property in target) return target[property as string]
        return async () => null
      },
    })
  }, JWT)

  page.on('request', request => allUrls.push(request.url()))

  await page.route('**/factory-service/**', async route => {
    const request = route.request()
    const isDevicesCall = request.url().includes(DEVICES_PATH)
    if (isDevicesCall) {
      captured.push({
        url: request.url(),
        authorization: request.headers().authorization,
      })
      if (failFirstDevicesRequest && !firstRequestFailed) {
        firstRequestFailed = true
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
        return
      }
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  await page.goto('/')
})

test('REST calls go through the gateway prefix with a bearer token', async ({ page }) => {
  const status = await page.evaluate(async ({ modulePath, path }) => {
    const client = await import(modulePath)
    const response = await client.gatewayFetch(path)
    return response.status
  }, { modulePath: CLIENT_MODULE, path: DEVICES_PATH })

  expect(status).toBe(200)
  expect(captured).toHaveLength(1)
  expect(captured[0].url).toContain('/factory-service/api/digital-twin/devices')
  expect(captured[0].authorization).toBe(`Bearer ${JWT}`)
  expect(captured[0].url).not.toMatch(/:(10101|8082|8080)\b/)
})

test('a 401 invalidates the cached JWT and retries once', async ({ page }) => {
  failFirstDevicesRequest = true

  const status = await page.evaluate(async ({ modulePath, path }) => {
    const client = await import(modulePath)
    const response = await client.gatewayFetch(path)
    return response.status
  }, { modulePath: CLIENT_MODULE, path: DEVICES_PATH })

  const invalidations = await page.evaluate(() =>
    (window as unknown as { __gatewayAuthState: { invalidations: number } })
      .__gatewayAuthState.invalidations)

  expect(status).toBe(200)
  expect(captured).toHaveLength(2)
  expect(invalidations).toBe(1)
  expect(captured.every(request => request.authorization === `Bearer ${JWT}`)).toBe(true)
})

test('WebSocket handshake carries the JWT in the query string', async ({ page }) => {
  const url = await page.evaluate(async (modulePath) => {
    const client = await import(modulePath)
    return client.buildGatewayWsUrl()
  }, CLIENT_MODULE)

  expect(url).toContain('ws://')
  expect(url).toContain('/factory-service/ws/digital-twin')
  expect(new URL(url).searchParams.get('token')).toBe(JWT)
  expect(url).not.toMatch(/:(10101|8082|8080)\b/)
})

test('no request addresses a factory-service port directly', async () => {
  expect(allUrls.some(url => /:(10101|8082|8080)\b/.test(url))).toBe(false)
})
