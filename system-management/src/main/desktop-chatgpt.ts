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
        // console.log('[ChatGPT Monitor] Chunk received:', rawChunk.substring(0, 50) + '...')
        eventBus.emit('sse-chunk', rawChunk)
      } catch (e) {
        console.error('[ChatGPT Monitor] Failed to decode raw chunk:', e)
      }
    } else {
      console.log(`[ChatGPT Web] ${message}`)
    }
  })

  const inject = () => {
    monitorWindow?.webContents.executeJavaScript(injectScript)
      .then(() => console.log('[ChatGPT Monitor] Injection success'))
      .catch(err => console.error('[ChatGPT Monitor] Injection failed:', err))
  }

  monitorWindow.webContents.on('did-finish-load', inject)
  monitorWindow.webContents.on('did-navigate', inject)

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
            res.end('ChatGPT window not initialized. Please click the button in UI first.')
            return
          }

          console.log('[API] New prompt request received:', prompt.substring(0, 50) + '...')

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
          })

          const onChunk = (chunk: string) => {
            res.write(chunk)
            if (chunk.includes('[DONE]')) {
              console.log('[API] Response finished ([DONE] received)')
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
          try {
            const result = await monitorWindow.webContents.executeJavaScript(`window.automateChat(${JSON.stringify(prompt)})`)
            if (!result.success) {
              console.error('[API] Automation failed:', result.error)
              res.write(`data: {"error": "${result.error}"}\n\n`)
              cleanup()
            }
          } catch (error: any) {
            console.error('[API] Execution failed:', error)
            res.write(`data: {"error": "Execution failed: ${error.message}"}\n\n`)
            cleanup()
          }

          req.on('close', () => {
              console.log('[API] Client disconnected')
              cleanup()
          })
        } catch (err) {
          console.error('[API] Internal error:', err)
          if (!res.headersSent) {
            res.writeHead(500)
          }
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