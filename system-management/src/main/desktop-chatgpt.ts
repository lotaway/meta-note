import { session, shell } from 'electron'
import path from 'node:path'
import { APP_DISPLAY_NAME, APP_PROTOCOL_DEFAULT } from '../brand'
import { AI_CHAT_CONSTANTS, MONITOR_HOSTS } from './constants'
import { EnhancedBrowserWindow } from './browser/enhanced-browser-window'

const PARTITION = 'persist:chatgpt'
const HOST = MONITOR_HOSTS.chatgpt

class ChatGPTMonitor extends EnhancedBrowserWindow {
    constructor() {
        super({
            url: HOST,
            title: `${APP_DISPLAY_NAME} - ChatGPT Monitor`,
            partition: PARTITION,
            injectScriptPath: path.join(__dirname, 'chatgpt-inject.js'),
            sseChunkEvent: AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT,
        })

        const proxyUrl = process.env.PROXY_URL
        if (proxyUrl && proxyUrl.trim()) {
            void session.fromPartition(PARTITION)
                .setProxy({ proxyRules: proxyUrl.trim() })
                .catch(err => console.error('[ChatGPT] Failed to set proxy:', err))
        }
    }

    public async setSessionToken(token: string): Promise<void> {
        await this.setSessionCookie({
            url: HOST,
            name: AI_CHAT_CONSTANTS.SESSION_COOKIE_NAME,
            value: token,
            domain: AI_CHAT_CONSTANTS.COOKIE_DOMAIN,
        })
    }

    public destroy(): void {
        super.destroy()
        chatGPTMonitor = null
    }

    public close(): void {
        super.close()
        chatGPTMonitor = null
    }
}

let chatGPTMonitor: ChatGPTMonitor | null = null

export function getChatGPTMonitor(): ChatGPTMonitor {
    if (!chatGPTMonitor || !chatGPTMonitor.exists()) {
        chatGPTMonitor = new ChatGPTMonitor()
        chatGPTMonitor.load()
    }
    return chatGPTMonitor
}

export function setupChatGPTMonitor(): void {
    const monitor = getChatGPTMonitor()
    if (monitor.exists()) {
        monitor.focus()
    }
}

export function getChatGPTEventBus() {
    return getChatGPTMonitor().getEventBus()
}

export function setSessionToken(token: string): void {
    void getChatGPTMonitor().setSessionToken(token).catch(err => {
        console.error('[ChatGPT] Failed to set session token:', err)
    })
}

export function openExternalLogin(): void {
    const protocol = process.env.APP_PROTOCOL || APP_PROTOCOL_DEFAULT
    const redirectUri = encodeURIComponent(`${protocol}://auth`)
    const loginUrl = `${HOST}/auth/login?redirect_uri=${redirectUri}&callbackUrl=${redirectUri}`
    void shell.openExternal(loginUrl).catch(err => {
        console.error('[ChatGPT] Failed to open external login:', err)
    })
}

export default {
    setupChatGPTMonitor,
    getChatGPTEventBus,
    getChatGPTMonitor,
    setSessionToken,
    openExternalLogin,
}
