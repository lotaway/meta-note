import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import {
  DIGITAL_TWIN_WS_PATH,
  FACTORY_SERVICE_BASE_URL,
  GATEWAY_BASE_URL,
} from '../config/gateway'

const TOKEN_MISSING_MESSAGE =
  'GATEWAY_TOKEN is not configured: set the digital-twin service account credentials in .env. ' +
  'Every server/ call must be authenticated by the gateway.'

/**
 * The JWT is owned by the Electron main process (dotenv + login/refresh), not
 * baked into the renderer bundle. It is exposed through a single named bridge.
 */
export async function getGatewayToken(): Promise<string> {
  const token = await window.desktop?.getGatewayToken?.()
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error(TOKEN_MISSING_MESSAGE)
  }
  return token.trim()
}

/** Drops the cached JWT after a 401 so the next call re-authenticates. */
export async function invalidateGatewayToken(): Promise<void> {
  await window.desktop?.invalidateGatewayToken?.()
}

function isReplayableBody(body: BodyInit | null | undefined): boolean {
  return body === undefined || body === null || typeof body === 'string'
}

async function send(path: string, token: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(`${FACTORY_SERVICE_BASE_URL}${path}`, { ...init, headers })
}

/** fetch() wrapper for every cross-service REST call. */
export async function gatewayFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getGatewayToken()
  const response = await send(path, token, init)
  // A 401 means the JWT was revoked/expired on the server. Retry once only for
  // replayable bodies; streaming bodies cannot be sent twice.
  if (response.status !== 401 || !isReplayableBody(init.body)) {
    return response
  }
  await invalidateGatewayToken()
  const refreshed = await getGatewayToken()
  return send(path, refreshed, init)
}

/** Attach the gateway JWT to an axios client created in the generated layer. */
export function installGatewayAuth(client: AxiosInstance): void {
  const retried = new WeakSet<InternalAxiosRequestConfig>()
  client.interceptors.request.use(async (config) => {
    const token = await getGatewayToken()
    config.headers.set('Authorization', `Bearer ${token}`)
    return config
  })
  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config
    if (error.response?.status !== 401 || !config || retried.has(config)) {
      return Promise.reject(error)
    }
    retried.add(config)
    await invalidateGatewayToken()
    return client(config)
  })
}

/**
 * Browsers cannot set headers on a WebSocket handshake, so the JWT is passed
 * as a ?token= query parameter. UserAuthFilter validates it and removes the
 * parameter before the request is proxied downstream.
 */
export async function buildGatewayWsUrl(path: string = DIGITAL_TWIN_WS_PATH): Promise<string> {
  const token = await getGatewayToken()
  const wsBase = GATEWAY_BASE_URL.replace(/^http/, 'ws')
  const url = new URL(path, wsBase)
  url.searchParams.set('token', token)
  return url.toString()
}
