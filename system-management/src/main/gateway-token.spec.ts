import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import { GatewayTokenManager, decodeJwtExpiry, readGatewayTokenConfig } from './gateway-token'

interface FakeResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

function jwt(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  return `header.${payload}.signature`
}

function response(body: unknown, status = 200): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

function config(overrides: Record<string, string> = {}) {
  return {
    gatewayUrl: 'http://gateway:10081',
    username: 'digital-twin',
    password: 'secret',
    ...overrides,
  }
}

function manager(fetchImpl: ReturnType<typeof vi.fn>, overrides: Record<string, string> = {}) {
  return new GatewayTokenManager(
    config(overrides),
    fetchImpl as unknown as typeof fetch,
  )
}

const loginBody = (token: string, code = '0000') => ({ code, data: { token, tokenHead: 'Bearer ' } })

describe('decodeJwtExpiry', () => {
  it('reads the exp claim', () => {
    expect(decodeJwtExpiry(jwt(1_800_000_000))).toBe(1_800_000_000)
  })

  it('rejects malformed tokens', () => {
    expect(decodeJwtExpiry('not-a-jwt')).toBeNull()
    expect(decodeJwtExpiry('a.!!!.c')).toBeNull()
  })
})

describe('readGatewayTokenConfig', () => {
  it('builds the gateway URL from host and port', () => {
    expect(readGatewayTokenConfig({
      VITE_GATEWAY_HOST: 'edge',
      VITE_GATEWAY_PORT: '10081',
      GATEWAY_SERVICE_ACCOUNT_USERNAME: 'digital-twin',
      GATEWAY_SERVICE_ACCOUNT_PASSWORD: 'secret',
    }).gatewayUrl).toBe('http://edge:10081')
  })

  it('prefers an explicit URL override', () => {
    expect(readGatewayTokenConfig({ VITE_GATEWAY_URL: 'http://gateway:10081/' }).gatewayUrl)
      .toBe('http://gateway:10081')
  })
})

describe('GatewayTokenManager', () => {
  it('logs in through the gateway on first use', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response(loginBody(jwt(Math.floor(Date.now() / 1000) + 3600))),
    )
    const token = await manager(fetchImpl).getToken()

    expect(token).toContain('signature')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://gateway:10081/mall-user-service/admin/login')
    expect(JSON.parse(init.body)).toEqual({ username: 'digital-twin', password: 'secret' })
  })

  it('reuses a cached token until the refresh window', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response(loginBody(jwt(Math.floor(Date.now() / 1000) + 3600))),
    )
    const instance = manager(fetchImpl)
    const first = await instance.getToken()
    const second = await instance.getToken()

    expect(second).toBe(first)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('refreshes a token that is about to expire', async () => {
    const now = Math.floor(Date.now() / 1000)
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response(loginBody(jwt(now + 60))))
      .mockResolvedValueOnce(response(loginBody(jwt(now + 7200))))
    const instance = manager(fetchImpl)

    const first = await instance.getToken()
    const second = await instance.getToken()

    expect(second).not.toBe(first)
    const [url, init] = fetchImpl.mock.calls[1]
    expect(url).toBe('http://gateway:10081/mall-user-service/admin/refreshToken')
    expect(init.headers.Authorization).toBe(`Bearer ${first}`)
  })

  it('falls back to login when the cached token has expired', async () => {
    const now = Math.floor(Date.now() / 1000)
    const fetchImpl = vi.fn().mockResolvedValue(
      response(loginBody(jwt(now - 10))),
    )
    const instance = manager(fetchImpl)

    await instance.getToken()
    await instance.getToken()

    expect(fetchImpl.mock.calls.map(call => call[0])).toEqual([
      'http://gateway:10081/mall-user-service/admin/login',
      'http://gateway:10081/mall-user-service/admin/login',
    ])
  })

  it('re-authenticates after invalidation', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response(loginBody(jwt(Math.floor(Date.now() / 1000) + 3600))),
    )
    const instance = manager(fetchImpl)

    await instance.getToken()
    instance.invalidate()
    await instance.getToken()

    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('reports missing service-account credentials', async () => {
    const fetchImpl = vi.fn()
    await expect(manager(fetchImpl, { username: '', password: '' }).getToken())
      .rejects.toThrow('Gateway service account is not configured')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('surfaces an HTTP failure instead of silently retrying forever', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ message: 'unauthorized' }, 401))
    await expect(manager(fetchImpl).getToken()).rejects.toThrow('HTTP 401')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('uses a static break-glass JWT without any network call', async () => {
    const fetchImpl = vi.fn()
    const token = await manager(fetchImpl, { staticToken: 'pasted-jwt' }).getToken()
    expect(token).toBe('pasted-jwt')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('rejects a token without an exp claim', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(loginBody('opaque-token')))
    await expect(manager(fetchImpl).getToken()).rejects.toThrow('no exp claim')
  })
})
