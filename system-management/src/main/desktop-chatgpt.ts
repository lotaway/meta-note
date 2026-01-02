import { BrowserWindow, session, shell } from 'electron'
import http from 'node:http'
import { EventEmitter } from 'node:events'
import { CHATGPT_CONSTANTS } from './constants'
import fs from 'node:fs'
import path from 'node:path'
import { ChatgptConversationData } from '../types/ChatgptConversationData'
import { CompletionData } from '../types/CompletionData'
import { controllers } from './controllers'

interface ConversationEvent {
  message?: {
    id: string
    content: {
      parts: string[]
    }
  }
}

export function setSessionToken(token: string) {
  const cookie = {
    url: CHATGPT_CONSTANTS.CHATGPT_HOST,
    name: CHATGPT_CONSTANTS.SESSION_COOKIE_NAME,
    value: token,
    domain: CHATGPT_CONSTANTS.COOKIE_DOMAIN,
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax' as any
  }

  session.defaultSession.cookies.set(cookie).then(() => {
    console.log('[ChatGPT] Session token applied successfully')
    if (monitorWindow) {
      monitorWindow.loadURL(CHATGPT_CONSTANTS.CHATGPT_HOST)
    }
  }).catch(err => {
    console.error('[ChatGPT] Failed to set cookie:', err)
  })
}

export function openExternalLogin() {
  const appProtocol = process.env.APP_PROTOCOL || 'meta-note'
  const redirectUri = encodeURIComponent(`${appProtocol}://auth`)
  const loginUrl = `${CHATGPT_CONSTANTS.CHATGPT_HOST}/auth/login?redirect_uri=${redirectUri}&callbackUrl=${redirectUri}`

  console.log('[ChatGPT] Opening external login:', loginUrl)
  shell.openExternal(loginUrl)
}

const injectScriptPath = path.join(__dirname, 'chatgpt-inject.js')

function getInjectScript() {
  if (fs.existsSync(injectScriptPath)) {
    return fs.readFileSync(injectScriptPath, 'utf8')
  }
  console.error('[ChatGPT Monitor] Inject script not found at:', injectScriptPath)
  return ''
}

export const eventBus = new EventEmitter()
export let monitorWindow: BrowserWindow | null = null
let server: http.Server | null = null

export function setupChatGPTMonitor() {
  if (monitorWindow) {
    monitorWindow.focus()
    return
  }

  monitorWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'ChatGPT Monitor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  monitorWindow.on('closed', () => {
    monitorWindow = null
  })

  monitorWindow.webContents.on('console-message', (event, level, message) => {
      if (message.startsWith(CHATGPT_CONSTANTS.SSE_RAW_PREFIX)) {
        const base64Data = message.substring(CHATGPT_CONSTANTS.SSE_RAW_PREFIX.length)
        try {
          const rawChunk = decodeURIComponent(escape(atob(base64Data)))
          eventBus.emit(CHATGPT_CONSTANTS.SSE_CHUNK_EVENT, rawChunk)
        } catch (e) {
          console.error('[ChatGPT Monitor] Failed to decode raw chunk:', e)
        }
      } else {
        console.log(`[ChatGPT Web] ${message}`)
      }
  })

  const inject = () => {
    const script = getInjectScript()
    if (!script) return

    monitorWindow?.webContents.executeJavaScript(script)
      .then(() => console.log('[ChatGPT Monitor] Injection success'))
      .catch(err => console.error('[ChatGPT Monitor] Injection failed:', err))
  }

  monitorWindow.webContents.on('did-finish-load', inject)
  monitorWindow.webContents.on('did-navigate', inject)
  monitorWindow.webContents.on('dom-ready', inject)

  monitorWindow.loadURL(CHATGPT_CONSTANTS.CHATGPT_HOST)
}

function startLocalServer() {
  if (server) return

  const PORT = 5051
  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'POST') {
      for (const controller of controllers) {
        if (controller.checker(req)) {
          const result = controller.handler(req, res)
          if (result instanceof Promise) {
            result.catch(err => {
              console.error('[Controller] Handler error:', err)
              if (!res.headersSent) {
                res.writeHead(500)
                res.end(JSON.stringify({ error: 'Internal server error' }))
              }
            })
          }
          return
        }
      }
    }

    res.writeHead(404)
    res.end('Not Found')
  })

  server.listen(PORT, () => {
    console.log(`[ChatGPT Server] Listening on http://localhost:${PORT}`)
  })
}

export function getConversationCache(): ConversationEvent[] {
  return []
}

export default {
  setupChatGPTMonitor,
  getConversationCache,
  setSessionToken,
  openExternalLogin
}