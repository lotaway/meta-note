import { createServer, request as httpRequest, type Server } from 'node:http'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { bootstrapGatewayAccount } from '../../scripts/bootstrap-gateway-account.mjs'

interface RecordedRequest {
  method: string
  path: string
  authorization?: string
  body?: Record<string, unknown>
}

interface MockResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

let server: Server
let gatewayUrl: string
let recorded: RecordedRequest[]
let accounts: Array<{ id: number; username: string }>

/** A real HTTP client for the real local gateway stub used by this test. */
function httpFetch(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<MockResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const req = httpRequest(
      {
        hostname: target.hostname,
        port: target.port,
        path: target.pathname + target.search,
        method: init.method || 'GET',
        headers: init.headers || {},
      },
      (res) => {
        let raw = ''
        res.on('data', chunk => { raw += chunk })
        res.on('end', () => {
          const status = res.statusCode ?? 500
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: async () => JSON.parse(raw),
          })
        })
      },
    )
    req.on('error', reject)
    if (init.body) req.write(init.body)
    req.end()
  })
}

function ok(data: unknown = null) {
  return { code: '0000', data }
}

beforeAll(async () => {
  accounts = []
  server = createServer((req, res) => {
    const target = new URL(req.url || '/', 'http://127.0.0.1')
    let raw = ''
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : undefined
      recorded.push({
        method: req.method || '',
        path: target.pathname + target.search,
        authorization: req.headers.authorization,
        body,
      })
      const send = (payload: unknown, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(payload))
      }
      if (target.pathname === '/mall-user-service/admin/login') {
        if (body?.username === 'admin' && body?.password === 'secret') {
          return send(ok({ token: 'administrator-jwt', tokenHead: 'Bearer ' }))
        }
        return send({ code: '401', message: 'bad credentials' }, 401)
      }
      if (req.headers.authorization !== 'Bearer administrator-jwt') {
        return send({ code: '401', message: 'missing administrator token' }, 401)
      }
      if (target.pathname === '/mall-user-service/admin/list') {
        return send(ok({ records: accounts }))
      }
      if (target.pathname === '/mall-user-service/admin/register') {
        const id = accounts.length + 100
        accounts.push({ id, username: String(body?.username) })
        return send(ok())
      }
      if (target.pathname === '/mall-user-service/admin/role/update') {
        return send(ok())
      }
      return send({ code: '404', message: 'unknown route' }, 404)
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to bind mock gateway')
  gatewayUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()))
})

describe('gateway service-account bootstrap (integration)', () => {
  const config = () => ({
    gatewayUrl,
    bootstrapUsername: 'admin',
    bootstrapPassword: 'secret',
    accountUsername: 'digital-twin',
    accountPassword: 'machine-password',
    roleIds: '3001',
  })

  beforeEach(() => {
    recorded = []
  })

  it('creates the account through the gateway and assigns the requested role', async () => {
    accounts = []
    const result = await bootstrapGatewayAccount(config(), httpFetch)

    expect(result.created).toBe(true)
    expect(result.username).toBe('digital-twin')
    expect(result.adminId).toBe(100)
    expect(result.roleAssigned).toBe(true)
    expect(recorded.every(call => call.path.startsWith('/mall-user-service/'))).toBe(true)

    const login = recorded.find(call => call.path.includes('/admin/login'))
    expect(login?.method).toBe('POST')
    expect(login?.authorization).toBeUndefined()

    const register = recorded.find(call => call.path.includes('/admin/register'))
    expect(register?.authorization).toBe('Bearer administrator-jwt')
    expect(register?.body?.password).toBe('machine-password')

    const roleUpdate = recorded.find(call => call.path.includes('/admin/role/update'))
    expect(roleUpdate?.method).toBe('POST')
    expect(roleUpdate?.path).toContain('adminId=100')
    expect(roleUpdate?.path).toContain('roleIds=3001')
  })

  it('is idempotent on a second run', async () => {
    const result = await bootstrapGatewayAccount(config(), httpFetch)

    expect(result.created).toBe(false)
    expect(recorded.some(call => call.path.includes('/admin/register'))).toBe(false)
    expect(accounts).toHaveLength(1)
  })

  it('rejects a missing bootstrap administrator password before any request', async () => {
    recorded = []
    await expect(bootstrapGatewayAccount(
      { ...config(), bootstrapPassword: '' },
      httpFetch,
    )).rejects.toThrow('BOOTSTRAP_ADMIN_USERNAME')
    expect(recorded).toHaveLength(0)
  })
})
