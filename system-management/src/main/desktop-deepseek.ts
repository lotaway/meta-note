import { shell } from 'electron'
import path from 'node:path'
import { APP_DISPLAY_NAME, APP_PROTOCOL_DEFAULT } from '../brand'
import { AI_CHAT_CONSTANTS, MONITOR_HOSTS } from './constants'
import { EnhancedBrowserWindow } from './browser/enhanced-browser-window'

const PARTITION = 'persist:deepseek'
const HOST = MONITOR_HOSTS.deepseek
const SESSION_COOKIE_NAME = process.env.DEEPSEEK_SESSION_COOKIE_NAME || 'ds_session_token'

class DeepSeekMonitor extends EnhancedBrowserWindow {
    constructor() {
        super({
            url: HOST,
            title: `${APP_DISPLAY_NAME} - DeepSeek Monitor`,
            partition: PARTITION,
            injectScriptPath: path.join(__dirname, 'deepseek-inject.js'),
            sseChunkEvent: AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT,
        })
    }

    public async setSessionToken(token: string): Promise<void> {
        await this.setSessionCookie({
            url: HOST,
            name: SESSION_COOKIE_NAME,
            value: token,
            domain: '.deepseek.com',
        })
    }

    public destroy(): void {
        super.destroy()
        deepSeekMonitor = null
    }

    public close(): void {
        super.close()
        deepSeekMonitor = null
    }
}

let deepSeekMonitor: DeepSeekMonitor | null = null

export function getDeepSeekMonitor(): DeepSeekMonitor {
    if (!deepSeekMonitor || !deepSeekMonitor.exists()) {
        deepSeekMonitor = new DeepSeekMonitor()
        deepSeekMonitor.load()
    }
    return deepSeekMonitor
}

export function setupDeepSeekMonitor(): void {
    const monitor = getDeepSeekMonitor()
    if (monitor.exists()) {
        monitor.focus()
    }
}

export function getDeepSeekEventBus() {
    return getDeepSeekMonitor().getEventBus()
}

export function setDeepSeekSessionToken(token: string): void {
    void getDeepSeekMonitor().setSessionToken(token).catch(err => {
        console.error('[DeepSeek] Failed to set session token:', err)
    })
}

export function openDeepSeekExternalLogin(): void {
    const protocol = process.env.APP_PROTOCOL || APP_PROTOCOL_DEFAULT
    const redirectUri = encodeURIComponent(`${protocol}://auth-deepseek`)
    const loginUrl = `${HOST}/auth/login?redirect_uri=${redirectUri}&callbackUrl=${redirectUri}`
    void shell.openExternal(loginUrl).catch(err => {
        console.error('[DeepSeek] Failed to open external login:', err)
    })
}

export default {
    setupDeepSeekMonitor,
    getDeepSeekEventBus,
    getDeepSeekMonitor,
    setDeepSeekSessionToken,
    openDeepSeekExternalLogin,
}
