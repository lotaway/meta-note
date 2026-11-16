import type { AxiosInstance } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DIGITAL_TWIN_WS_PATH,
  FACTORY_SERVICE_BASE_URL,
  GATEWAY_BASE_URL,
} from '../config/gateway'
import {
  buildGatewayWsUrl,
  gatewayFetch,
  getGatewayToken,
  installGatewayAuth,
} from './gateway-client'

const JWT = 'service-account-jwt'

function fakeResponse(status: number): Response {
  return { status } as Response
}

function stubDesktop() {
  const invalidate = vi.fn(async () => undefined)
  Object.defineProperty(window, 'desktop', {
    configurable: true,
    value: {
      getGatewayToken: async () => JWT,
      invalidateGatewayToken: invalidate,
    },
  })
  return { invalidate }
}

describe('gateway-client', () => {
  beforeEach(() => {
    stubDesktop()
    vi.restoreAllMocks()
  })

  it('reads the token through the named bridge', async () => {
    await expect(getGatewayToken()).resolves.toBe(JWT)
  })

  it('rejects a missing token with an actionable message', async () => {
    Object.defineProperty(window, 'desktop', {
      configurable: true,
      value: { getGatewayToken: async () => null },
    })
    await expect(getGatewayToken()).rejects.toThrow('GATEWAY_TOKEN is not configured')
  })

  it('sends REST calls to the gateway prefix with a bearer token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200))
    vi.stubGlobal('fetch', fetchImpl)

    await gatewayFetch('/api/digital-twin/devices')

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe(`${FACTORY_SERVICE_BASE_URL}/api/digital-twin/devices`)
    expect(url).toContain('/factory-service/')
    expect(url).not.toMatch(/:(10101|8082|8080)\b/)
    expect(init.headers.get('Authorization')).toBe(`Bearer ${JWT}`)
  })

  it('invalidates and retries once after a 401', async () => {
    const { invalidate } = stubDesktop()
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(401))
      .mockResolvedValueOnce(fakeResponse(200))
    vi.stubGlobal('fetch', fetchImpl)

    const result = await gatewayFetch('/api/digital-twin/devices')

    expect(result.status).toBe(200)
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('does not retry a 401 for a non-replayable body', async () => {
    const { invalidate } = stubDesktop()
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(401))
    vi.stubGlobal('fetch', fetchImpl)

    const result = await gatewayFetch('/api/digital-twin/devices', {
      method: 'POST',
      body: new Blob(['{}']),
    })

    expect(result.status).toBe(401)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('builds a WS handshake URL with the token in the query', async () => {
    const url = await buildGatewayWsUrl()
    expect(url).toBe(`${GATEWAY_BASE_URL.replace(/^http/, 'ws')}${DIGITAL_TWIN_WS_PATH}?token=${JWT}`)
    expect(url).not.toMatch(/:(10101|8082|8080)\b/)
  })

  it('attaches the token to hand-written API clients', async () => {
    const client: any = Object.assign(vi.fn(), {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })
    installGatewayAuth(client as AxiosInstance)

    const requestHandler = client.interceptors.request.use.mock.calls[0][0]
    const headers = { set: vi.fn() }
    const requestConfig = { headers }
    await requestHandler(requestConfig)
    expect(headers.set).toHaveBeenCalledWith('Authorization', `Bearer ${JWT}`)
  })

  it('retries an axios request once after a 401', async () => {
    const { invalidate } = stubDesktop()
    const client: any = Object.assign(vi.fn().mockResolvedValue('retried'), {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })
    installGatewayAuth(client as AxiosInstance)

    const responseHandler = client.interceptors.response.use.mock.calls[0][1]
    const config = { headers: { set: vi.fn() } }
    await expect(responseHandler({ response: { status: 401 }, config })).resolves.toBe('retried')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(client).toHaveBeenCalledWith(config)
  })

  it('does not retry non-401 axios failures', async () => {
    const client: any = Object.assign(vi.fn(), {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })
    installGatewayAuth(client as AxiosInstance)

    const responseHandler = client.interceptors.response.use.mock.calls[0][1]
    await expect(responseHandler({ response: { status: 500 }, config: {} }))
      .rejects.toMatchObject({ response: { status: 500 } })
    expect(client).not.toHaveBeenCalled()
  })
})
