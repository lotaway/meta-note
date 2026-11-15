import { Buffer } from 'node:buffer'

const USER_SERVICE = '/mall-user-service'
const LOGIN_PATH = `${USER_SERVICE}/admin/login`
const REFRESH_PATH = `${USER_SERVICE}/admin/refreshToken`
const REFRESH_SKEW_SECONDS = 300

export interface GatewayTokenConfig {
  gatewayUrl: string
  username?: string
  password?: string
  /** Break-glass override: a manually issued JWT. No login or refresh. */
  staticToken?: string
}

interface LoginResponse {
  code?: string
  message?: string
  data?: { token?: string; tokenHead?: string }
}

function resolveGatewayUrl(env: NodeJS.ProcessEnv): string {
  const explicit = (env.GATEWAY_AUTH_URL || env.VITE_GATEWAY_URL || '').trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const host = (env.VITE_GATEWAY_HOST || 'localhost').trim()
  const port = (env.VITE_GATEWAY_PORT || '10081').trim()
  return `http://${host}:${port}`
}

/** Reads credentials in the Electron main process; never exposed to the renderer. */
export function readGatewayTokenConfig(env: NodeJS.ProcessEnv = process.env): GatewayTokenConfig {
  return {
    gatewayUrl: resolveGatewayUrl(env),
    username: env.GATEWAY_SERVICE_ACCOUNT_USERNAME?.trim() || undefined,
    password: env.GATEWAY_SERVICE_ACCOUNT_PASSWORD || undefined,
    staticToken: env.GATEWAY_TOKEN?.trim() || undefined,
  }
}

export function decodeJwtExpiry(jwt: string): number | null {
  const parts = jwt.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

/**
 * Owns the platform JWT used for every gateway call.
 *
 * The standard path is a dedicated service account: POST /admin/login on first
 * use, POST /admin/refreshToken before the token expires, re-login on a 401.
 * A static GATEWAY_TOKEN is accepted only as a break-glass override.
 */
export class GatewayTokenManager {
  private token: string | null = null
  private expiresAtSeconds = 0
  private pending: Promise<string> | null = null

  constructor(
    private readonly config: GatewayTokenConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) { }

  async getToken(): Promise<string> {
    if (this.config.staticToken) return this.config.staticToken
    if (this.isUsable()) return this.token as string
    if (!this.pending) {
      this.pending = this.issueToken().finally(() => {
        this.pending = null
      })
    }
    return this.pending
  }

  /** Called when a gateway call returns 401 so the next call re-authenticates. */
  invalidate(): void {
    this.token = null
    this.expiresAtSeconds = 0
  }

  private isUsable(): boolean {
    if (!this.token) return false
    return Date.now() / 1000 < this.expiresAtSeconds - REFRESH_SKEW_SECONDS
  }

  private async issueToken(): Promise<string> {
    const { username, password } = this.config
    if (!username || !password) {
      throw new Error(
        'Gateway service account is not configured: set GATEWAY_SERVICE_ACCOUNT_USERNAME and ' +
        'GATEWAY_SERVICE_ACCOUNT_PASSWORD, or run the account bootstrap script.',
      )
    }
    if (this.canRefresh()) {
      try {
        return await this.requestToken(REFRESH_PATH, { Authorization: `Bearer ${this.token}` })
      } catch {
        this.invalidate()
      }
    }
    return this.requestToken(LOGIN_PATH, {
      'Content-Type': 'application/json',
    }, JSON.stringify({ username, password }))
  }

  private canRefresh(): boolean {
    return this.token !== null && Date.now() / 1000 < this.expiresAtSeconds
  }

  private async requestToken(path: string, extraHeaders: Record<string, string>, body?: string): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    }
    const response = await this.fetchImpl(`${this.config.gatewayUrl}${path}`, {
      method: 'POST',
      headers,
      body,
    })
    if (!response.ok) {
      throw new Error(`Gateway token request failed: HTTP ${response.status} (${path})`)
    }
    const payload = (await response.json()) as LoginResponse
    const token = payload.data?.token
    if (!token || (payload.code && payload.code !== '0000')) {
      throw new Error(`Gateway token request failed: ${payload.message || payload.code} (${path})`)
    }
    const expiry = decodeJwtExpiry(token)
    if (expiry === null) {
      throw new Error('Gateway JWT has no exp claim; cannot schedule refresh')
    }
    this.token = token
    this.expiresAtSeconds = expiry
    return token
  }
}
