import { shell } from 'electron'
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

const DEEPSEEK_CONSTANTS = {
  HOST: 'https://chat.deepseek.com',
  SSE_RAW_PREFIX: AI_CHAT_CONSTANTS.SSE_RAW_PREFIX,
  SSE_CHUNK_EVENT: AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT
} as const

class DeepSeekMonitor extends EnhancedBrowserWindow {
  constructor() {
    super({
      url: DEEPSEEK_CONSTANTS.HOST,
      title: 'DeepSeek Monitor',
      injectScriptPath: path.join(__dirname, 'deepseek-inject.js'),
      sseRawPrefix: DEEPSEEK_CONSTANTS.SSE_RAW_PREFIX,
      sseChunkEvent: DEEPSEEK_CONSTANTS.SSE_CHUNK_EVENT
    })
  }

  public async setSessionToken(token: string): Promise<void> {
    console.log('[DeepSeek] Setting session token:', token)
  }

  public destroy() {
    super.destroy()
    deepSeekMonitor = null
  }

  public close() {
    super.close()
    deepSeekMonitor = null
  }
}

let deepSeekMonitor: DeepSeekMonitor | null = null

export function getDeepSeekMonitor(recreate: boolean = false): DeepSeekMonitor {
  if (!deepSeekMonitor || !deepSeekMonitor.exists()) {
    deepSeekMonitor = new DeepSeekMonitor()
    deepSeekMonitor.load()
  }
  else if (recreate) {
    deepSeekMonitor.reload()
  }
  return deepSeekMonitor
}

export function setupDeepSeekMonitor(recreate: boolean = false): void {
  const monitor = getDeepSeekMonitor(recreate)
  if (monitor.exists()) {
    monitor.focus()
  }
}

export function setDeepSeekSessionToken(token: string): void {
  const monitor = getDeepSeekMonitor()
  monitor.setSessionToken(token)
}

export function openDeepSeekExternalLogin(): void {
  const appProtocol = process.env.APP_PROTOCOL || 'meta-note'
  const redirectUri = encodeURIComponent(`${appProtocol}://auth-deepseek`)
  const loginUrl = `${DEEPSEEK_CONSTANTS.HOST}/auth/login?redirect_uri=${redirectUri}&callbackUrl=${redirectUri}`

  console.log('[DeepSeek] Opening external login:', loginUrl)
  shell.openExternal(loginUrl)
}

export function getDeepSeekEventBus() {
  const monitor = getDeepSeekMonitor()
  return monitor.getEventBus()
}

export function getDeepSeekConversationCache(): ConversationEvent[] {
  return []
}

export default {
  setupDeepSeekMonitor,
  getDeepSeekConversationCache,
  setDeepSeekSessionToken,
  openDeepSeekExternalLogin,
  getDeepSeekEventBus
}