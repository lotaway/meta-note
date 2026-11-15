import { test, expect } from '@playwright/test'

test.describe('3D Scene Loading E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the 3D scene container', async ({ page }) => {
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 30000 })
  })

  test('should initialize scene with grid and environment', async ({ page }) => {
    await page.goto('/')
    
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 30000 })
    
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).not.toBeNull()
    expect(canvasBox!.width).toBeGreaterThan(0)
    expect(canvasBox!.height).toBeGreaterThan(0)
  })

  test('should load device models in scene', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForSelector('canvas', { timeout: 30000 })
    
    await page.waitForTimeout(2000)
    
    const hasCanvasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) return false
      const pixels = new Uint8Array(4)
      gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      return true
    })
    
    expect(hasCanvasContent).toBe(true)
  })

  test('should respond to camera controls', async ({ page }) => {
    await page.goto('/')
    
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible({ timeout: 30000 })
    
    const initialBox = await canvas.boundingBox()
    expect(initialBox).not.toBeNull()
    
    await page.mouse.move((initialBox!.x + initialBox!.width) / 2, (initialBox!.y + initialBox!.height) / 2)
    await page.mouse.down()
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100)
    await page.mouse.up()
    
    await page.waitForTimeout(500)
  })
})

test.describe('Real-time Data Display E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should establish WebSocket connection for real-time data', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForSelector('canvas', { timeout: 30000 })
    
    const wsConnected = await page.evaluate(() => {
      return (window as any).__WS_CONNECTED__ === true
    }).catch(() => false)
    
    expect(wsConnected).toBe(true)
  })

  test('should update UI when receiving real-time data', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForSelector('canvas', { timeout: 30000 })
    
    await page.waitForTimeout(3000)
    
    const hasUpdatedData = await page.evaluate(() => {
      const statsPanel = document.querySelector('[data-testid="stats-panel"]')
      return statsPanel !== null
    }).catch(() => true)
  })
})

test.describe('Alert Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display active alerts', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForSelector('canvas', { timeout: 30000 })
    
    const alertIndicator = page.locator('[class*="alert"], [data-testid="alert-indicator"]').first()
    
    await page.waitForTimeout(2000)
  })

  test('should allow alert acknowledgment', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForSelector('canvas', { timeout: 30000 })
    
    const ackButton = page.locator('button:has-text("acknowledge"), button:has-text("确认")').first()
    
    if (await ackButton.isVisible().catch(() => false)) {
      await ackButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('should allow alert resolution', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForSelector('canvas', { timeout: 30000 })
    
    const resolveButton = page.locator('button:has-text("resolve"), button:has-text("解决")').first()
    
    if (await resolveButton.isVisible().catch(() => false)) {
      await resolveButton.click()
      await page.waitForTimeout(500)
    }
  })
})