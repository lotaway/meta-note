import { session, shell } from 'electron'
import path from 'node:path'
import { AI_CHAT_CONSTANTS } from './constants'
import { EnhancedBrowserWindow } from './browser/enhanced-browser-window'

interface ConversationEvent {
  message?: {
    id: string
    content: {
      parts: string[]
    }
  }
}

const CHATGPT_CONSTANTS = {
  HOST: AI_CHAT_CONSTANTS.CHATGPT_HOST,
  SSE_RAW_PREFIX: AI_CHAT_CONSTANTS.SSE_RAW_PREFIX,
  SSE_CHUNK_EVENT: AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT,
  SESSION_COOKIE_NAME: AI_CHAT_CONSTANTS.SESSION_COOKIE_NAME,
  COOKIE_DOMAIN: AI_CHAT_CONSTANTS.COOKIE_DOMAIN
} as const

class ChatGPTMonitor extends EnhancedBrowserWindow {
  constructor() {
    const partition = 'persist:chatgpt'

    super({
      url: CHATGPT_CONSTANTS.HOST,
      title: 'ChatGPT Monitor',
      injectScriptPath: path.join(__dirname, 'chatgpt-inject.js'),
      sseRawPrefix: CHATGPT_CONSTANTS.SSE_RAW_PREFIX,
      sseChunkEvent: CHATGPT_CONSTANTS.SSE_CHUNK_EVENT,
      partition
    })

    const proxyUrl = process.env.PROXY_URL
    if (proxyUrl && proxyUrl.trim()) {
      const sessionInstance = session.fromPartition(partition)
      sessionInstance.setProxy({ proxyRules: proxyUrl.trim() })
        .then(() => {
          console.log(`[${this.title}] Proxy set successfully: ${proxyUrl}`)
        })
        .catch((err: Error) => {
          console.error(`[${this.title}] Failed to set proxy:`, err)
        })
    }
  }

  public async setSessionToken(token: string): Promise<void> {
    const cookie = {
      url: CHATGPT_CONSTANTS.HOST,
      name: CHATGPT_CONSTANTS.SESSION_COOKIE_NAME,
      value: token,
      domain: CHATGPT_CONSTANTS.COOKIE_DOMAIN
    }

    await this.setSessionCookie(cookie)
  }

  public destroy(): void {
    super.destroy()
    chatGPTMonitor = null
  }

  public close() {
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

export function setSessionToken(token: string): void {
  const monitor = getChatGPTMonitor()
  monitor.setSessionToken(token).catch(err => {
    console.error('[ChatGPT] Failed to set session token:', err)
  })
}

export function openExternalLogin(): void {
  const appProtocol = process.env.APP_PROTOCOL || 'meta-note'
  const redirectUri = encodeURIComponent(`${appProtocol}://auth`)
  const loginUrl = `${CHATGPT_CONSTANTS.HOST}/auth/login?redirect_uri=${redirectUri}&callbackUrl=${redirectUri}`

  console.log('[ChatGPT] Opening external login:', loginUrl)
  shell.openExternal(loginUrl)
}

export function getChatGPTEventBus() {
  const monitor = getChatGPTMonitor()
  return monitor.getEventBus()
}

export function getConversationCache(): ConversationEvent[] {
  return []
}

export default {
  setupChatGPTMonitor,
  getConversationCache,
  setSessionToken,
  openExternalLogin,
  getChatGPTEventBus
}