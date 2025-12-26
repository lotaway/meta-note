import { BrowserWindow, session, shell } from 'electron'
import http from 'node:http'
import { EventEmitter } from 'node:events'

interface ConversationEvent {
  message?: {
    id: string
    content: {
      parts: string[]
    }
  }
}

const HOST = "https://chatgpt.com"

export function setSessionToken(token: string) {
  const cookie = {
    url: HOST,
    name: '__Secure-next-auth.session-token',
    value: token,
    domain: '.chatgpt.com',
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax' as any
  }

  session.defaultSession.cookies.set(cookie).then(() => {
    console.log('[ChatGPT] Session token applied successfully')
    if (monitorWindow) {
      monitorWindow.loadURL(HOST)
    }
  }).catch(err => {
    console.error('[ChatGPT] Failed to set cookie:', err)
  })
}

export function openExternalLogin() {
  shell.openExternal(`${HOST}/auth/login`)
}

import injectScript from './chatgpt-inject.js?raw'

const eventBus = new EventEmitter()
let monitorWindow: BrowserWindow | null = null
let server: http.Server | null = null

export function setupChatGPTMonitor() {
  if (monitorWindow) {
    monitorWindow.focus()
    return
  }

  monitorWindow = new BrowserWindow({
    width: 1000,
    height: 800,
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
    if (message.startsWith('SSE_RAW:')) {
      const base64Data = message.substring(8)
      try {
        const rawChunk = decodeURIComponent(escape(atob(base64Data)))
        eventBus.emit('sse-chunk', rawChunk)
      } catch (e) {
        console.error('Failed to decode raw chunk:', e)
      }
    }
  })

  monitorWindow.webContents.on('did-finish-load', () => {
    monitorWindow?.webContents.executeJavaScript(injectScript).catch(console.error)
  })

  monitorWindow.loadURL(HOST)

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

    if (req.url === '/chat/completions' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', async () => {
        try {
          const { prompt } = JSON.parse(body)
          if (!prompt) {
            res.writeHead(400)
            res.end('Missing prompt')
            return
          }

          if (!monitorWindow) {
            res.writeHead(500)
            res.end('ChatGPT window not initialized')
            return
          }

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          })

          const onChunk = (chunk: string) => {
            res.write(chunk)
            if (chunk.includes('[DONE]')) {
              cleanup()
            }
          }

          const cleanup = () => {
            eventBus.off('sse-chunk', onChunk)
            if (!res.writableEnded) res.end()
          }

          eventBus.on('sse-chunk', onChunk)

          const result = await monitorWindow.webContents.executeJavaScript(`window.automateChat(${JSON.stringify(prompt)})`)
          if (!result.success) {
            res.write(`data: {"error": "${result.error}"}\n\n`)
            cleanup()
          }

          req.on('close', cleanup)
        } catch (err) {
          res.writeHead(500)
          res.end(String(err))
        }
      })
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
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