#!/usr/bin/env node
// Provisions the dedicated digital-twin service account through the gateway.
//
// The platform design is: the seeded default administrator logs in through
// backstage-admin (or this script) and creates further admin accounts via
// POST /mall-user-service/admin/register, which requires X-User-Role: ADMIN.
// The gateway injects that header after validating the administrator's JWT, so
// this script never talks to mall-user-service directly and never holds the
// JWT signing secret.
import { pathToFileURL } from 'node:url'

const USER_SERVICE = '/mall-user-service'

function resolveGatewayUrl(env) {
  const explicit = (env.GATEWAY_AUTH_URL || env.VITE_GATEWAY_URL || '').trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const host = (env.VITE_GATEWAY_HOST || 'localhost').trim()
  const port = (env.VITE_GATEWAY_PORT || '10081').trim()
  return `http://${host}:${port}`
}

export function readBootstrapConfig(env = process.env) {
  return {
    gatewayUrl: resolveGatewayUrl(env),
    bootstrapUsername: (env.BOOTSTRAP_ADMIN_USERNAME || '').trim(),
    bootstrapPassword: env.BOOTSTRAP_ADMIN_PASSWORD || '',
    accountUsername: (env.GATEWAY_SERVICE_ACCOUNT_USERNAME || 'digital-twin').trim(),
    accountPassword: env.GATEWAY_SERVICE_ACCOUNT_PASSWORD || '',
    roleIds: (env.GATEWAY_SERVICE_ACCOUNT_ROLE_IDS || '').trim(),
  }
}

async function callGateway(config, path, { token, body, method } = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`${config.gatewayUrl}${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  if (!response.ok) {
    throw new Error(`${path} failed: HTTP ${response.status}`)
  }
  const payload = await response.json()
  if (payload.code && payload.code !== '0000') {
    throw new Error(`${path} failed: ${payload.message || payload.code}`)
  }
  return payload.data
}

async function findAdminId(config, token, username, fetchImpl) {
  const query = `?pageNum=1&pageSize=50&keyword=${encodeURIComponent(username)}`
  const page = await callGateway(config, `${USER_SERVICE}/admin/list${query}`, { token }, fetchImpl)
  const records = Array.isArray(page?.records) ? page.records : []
  const match = records.find(record => record.username === username)
  return match && match.id !== undefined ? match.id : null
}

/**
 * Idempotently creates the service account. Returns what happened so the CLI
 * can print instructions without ever printing a password or a token.
 */
export async function bootstrapGatewayAccount(config, fetchImpl = fetch) {
  if (!config.bootstrapUsername || !config.bootstrapPassword) {
    throw new Error('BOOTSTRAP_ADMIN_USERNAME and BOOTSTRAP_ADMIN_PASSWORD are required')
  }
  if (!config.accountPassword) {
    throw new Error('GATEWAY_SERVICE_ACCOUNT_PASSWORD is required')
  }

  const login = await callGateway(
    config,
    `${USER_SERVICE}/admin/login`,
    { body: { username: config.bootstrapUsername, password: config.bootstrapPassword } },
    fetchImpl,
  )
  const token = login?.token
  if (!token) {
    throw new Error('Administrator login returned no token')
  }

  let adminId = await findAdminId(config, token, config.accountUsername, fetchImpl)
  const created = adminId === null
  if (created) {
    await callGateway(
      config,
      `${USER_SERVICE}/admin/register`,
      {
        token,
        body: {
          username: config.accountUsername,
          password: config.accountPassword,
          nickName: 'Digital Twin Service',
          note: 'Machine account for the Electron digital-twin client',
        },
      },
      fetchImpl,
    )
    adminId = await findAdminId(config, token, config.accountUsername, fetchImpl)
  }

  let roleAssigned = false
  if (config.roleIds && adminId !== null) {
    const params = `?adminId=${encodeURIComponent(adminId)}&roleIds=${encodeURIComponent(config.roleIds)}`
    await callGateway(config, `${USER_SERVICE}/admin/role/update${params}`, { token, method: 'POST' }, fetchImpl)
    roleAssigned = true
  }

  return { created, username: config.accountUsername, adminId, roleAssigned }
}

async function main() {
  // This runs as a standalone Node process, so dotenv.config() in the Electron
  // main process does not apply here. .env is read from the app directory.
  await import('dotenv/config')
  const config = readBootstrapConfig()
  const result = await bootstrapGatewayAccount(config)
  const action = result.created ? 'created' : 'already exists'
  console.log(`Service account "${result.username}" ${action} (id=${result.adminId ?? 'unknown'}).`)
  console.log(`Role assignment ${result.roleAssigned ? 'applied' : 'skipped'}.`)
  console.log('Set GATEWAY_SERVICE_ACCOUNT_USERNAME and GATEWAY_SERVICE_ACCOUNT_PASSWORD in .env;')
  console.log('leave GATEWAY_TOKEN unset so the app logs in and refreshes its JWT through the gateway.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`Bootstrap failed: ${error.message}`)
    process.exitCode = 1
  })
}
