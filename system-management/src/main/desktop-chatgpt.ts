import { BrowserWindow, session, shell } from 'electron'
import http from 'node:http'
import { EventEmitter } from 'node:events'
import { CHATGPT_CONSTANTS } from './constants'
import fs from 'node:fs'
import path from 'node:path'

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
  const loginUrl = `${CHATGPT_CONSTANTS.CHATGPT_HOST}/auth/login?redirect_uri=${redirectUri}`

  console.log('[ChatGPT] Opening external login:', loginUrl)
  shell.openExternal(loginUrl)
}

const injectScriptPath = path.join(__dirname, 'chatgpt-inject.js')

function getInjectScript() {
  if (fs.existsSync(injectScriptPath)) {
    return fs.readFileSync(injectScriptPath, 'utf8').replace('__SSE_PREFIX__', CHATGPT_CONSTANTS.SSE_RAW_PREFIX)
  }
  console.error('[ChatGPT Monitor] Inject script not found at:', injectScriptPath)
  return ''
}

const eventBus = new EventEmitter()
let monitorWindow: BrowserWindow | null = null
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
        eventBus.emit('sse-chunk', rawChunk)
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

  monitorWindow.loadURL(CHATGPT_CONSTANTS.CHATGPT_HOST)

  startLocalServer()
}

function startLocalServer() {
  if (server) return

  const PORT = 5051
  server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.url !== '/chat/completions' || req.method !== 'POST') {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body)
        let prompt = payload.prompt
        if (!prompt && payload.messages && Array.isArray(payload.messages)) {
          const lastMsg = payload.messages[payload.messages.length - 1]
          prompt = lastMsg.content
        }

        if (!prompt) {
          res.writeHead(400)
          res.end(JSON.stringify({ error: 'Missing prompt or messages' }))
          return
        }

        if (!monitorWindow) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: 'ChatGPT window not initialized' }))
          return
        }

        console.log('[API] Processing prompt:', prompt.substring(0, 50) + '...')

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        })

        const onChunk = (chunk: string) => {
          res.write(chunk)
          if (chunk.includes('[DONE]')) {
            cleanup()
          }
        }

        const cleanup = () => {
          eventBus.off('sse-chunk', onChunk)
          if (!res.writableEnded) {
            res.end()
          }
        }

        eventBus.on('sse-chunk', onChunk)

        const result = await monitorWindow.webContents.executeJavaScript(`window.automateChat(${JSON.stringify(prompt)})`)
        if (!result.success) {
          console.error('[API] Automation result:', result.error)
          res.write(`data: {"error": "${result.error}"}\n\n`)
          cleanup()
        }

        req.on('close', cleanup)
      } catch (err: any) {
        console.error('[API] Server Error:', err)
        if (!res.headersSent) res.writeHead(500)
        res.end(String(err))
      }
    })
  })

  server.listen(PORT, () => {
    console.log(`[ChatGPT Server] Listening on http://localhost:${PORT}/chat/completions`)
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