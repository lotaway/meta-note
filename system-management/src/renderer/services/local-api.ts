const LOCAL_PORT = import.meta.env.VITE_WEB_SERVER_PORT || '5051'
const LOCAL_API_BASE = `http://127.0.0.1:${LOCAL_PORT}`
const LOCAL_API_HOSTS = [LOCAL_API_BASE, `http://localhost:${LOCAL_PORT}`]

export { LOCAL_API_BASE }

export function resolveApiBase(override?: string): string {
    const value = override?.trim()
    return value ? value.replace(/\/$/, '') : LOCAL_API_BASE
}

async function sessionToken(base: string): Promise<string | null> {
    if (!LOCAL_API_HOSTS.includes(base)) return null
    const bridge = window.desktop
    if (!bridge || typeof bridge.getLocalApiToken !== 'function') return null
    return await bridge.getLocalApiToken()
}

export async function apiFetch(path: string, init: RequestInit = {}, base = LOCAL_API_BASE): Promise<Response> {
    const headers = new Headers(init.headers)
    const token = await sessionToken(base)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${base}${path}`, { ...init, headers })
}

export async function apiStreamUrl(path: string, base = LOCAL_API_BASE): Promise<string> {
    const token = await sessionToken(base)
    if (!token) return `${base}${path}`
    return `${base}${path}?token=${encodeURIComponent(token)}`
}
