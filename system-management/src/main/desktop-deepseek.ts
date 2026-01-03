import { BrowserWindow, session, shell } from 'electron'
import http from 'node:http'
import { EventEmitter } from 'node:events'
import { AI_CHAT_CONSTANTS } from './constants'
import fs from 'node:fs'
import path from 'node:path'
import { CompletionData } from '../types/CompletionData'

interface DeepSeekConversationData {
  v?: any
  p?: string
  o?: string
  [key: string]: any
}

interface ConversationEvent {
  message?: {
    id: string
    content: {
      parts: string[]
    }
  }
}

export function setDeepSeekSessionToken(token: string) {
  console.log('[DeepSeek] Setting session token:', token)
}

export function openDeepSeekExternalLogin() {
  const appProtocol = process.env.APP_PROTOCOL || 'meta-note'
  const redirectUri = encodeURIComponent(`${appProtocol}://auth-deepseek`)
  const loginUrl = `https://chat.deepseek.com/auth/login?redirect_uri=${redirectUri}&callbackUrl=${redirectUri}`

  console.log('[DeepSeek] Opening external login:', loginUrl)
  shell.openExternal(loginUrl)
}

const injectScriptPath = path.join(__dirname, 'deepseek-inject.js')

function getInjectScript() {
  if (fs.existsSync(injectScriptPath)) {
    return fs.readFileSync(injectScriptPath, 'utf8')
  }
  console.error('[DeepSeek Monitor] Inject script not found at:', injectScriptPath)
  return ''
}

export const deepSeekEventBus = new EventEmitter()
export let deepSeekMonitorWindow: BrowserWindow | null = null
let deepSeekServer: http.Server | null = null

export function setupDeepSeekMonitor() {
  if (deepSeekMonitorWindow) {
    deepSeekMonitorWindow.focus()
    return
  }

  deepSeekMonitorWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'DeepSeek Monitor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  deepSeekMonitorWindow.on('closed', () => {
    deepSeekMonitorWindow = null
  })

  deepSeekMonitorWindow.webContents.on('console-message', (event, level, message) => {
    if (message.startsWith(AI_CHAT_CONSTANTS.SSE_RAW_PREFIX)) {
      const base64Data = message.substring(AI_CHAT_CONSTANTS.SSE_RAW_PREFIX.length)
      try {
        const rawChunk = decodeURIComponent(escape(atob(base64Data)))
        deepSeekEventBus.emit(AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT, rawChunk)
      } catch (e) {
        console.error('[DeepSeek Monitor] Failed to decode raw chunk:', e)
      }
    } else {
      console.log(`[DeepSeek Web] ${message}`)
    }
  })

  const inject = () => {
    const script = getInjectScript()
    if (!script) return

    deepSeekMonitorWindow?.webContents.executeJavaScript(script)
      .then(() => console.log('[DeepSeek Monitor] Injection success'))
      .catch(err => console.error('[DeepSeek Monitor] Injection failed:', err))
  }

  deepSeekMonitorWindow.webContents.on('did-finish-load', inject)
  deepSeekMonitorWindow.webContents.on('did-navigate', inject)
  deepSeekMonitorWindow.webContents.on('dom-ready', inject)

  deepSeekMonitorWindow.loadURL('https://chat.deepseek.com')
}

function startDeepSeekLocalServer() {
  if (deepSeekServer) return

  const PORT = 5052
  deepSeekServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'POST') {
      if (req.url === '/v1/auth/token') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { token } = JSON.parse(body)
            if (token) {
              setDeepSeekSessionToken(token)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ status: 'success' }))
              console.log('[DeepSeek API] Received session token from external source')
            } else {
              res.writeHead(400)
              res.end(JSON.stringify({ error: 'Missing token' }))
            }
          } catch (err) {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      if (req.url === '/v1/chat/completions') {
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

            if (!deepSeekMonitorWindow) {
              res.writeHead(500)
              res.end(JSON.stringify({ error: 'DeepSeek window not initialized' }))
              return
            }

            console.log('[DeepSeek API] Processing prompt:', prompt.substring(0, Math.min(prompt.length, 200)) + '...')

            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'X-Accel-Buffering': 'no'
            })

            const transformDeepSeekToCompletion = (data: DeepSeekConversationData): CompletionData | null => {
              if (!data) return null

              const completion: CompletionData = {
                id: Date.now().toString(),
                choices: [{
                  index: 0,
                  delta: {}
                }]
              }

              if (typeof data.v === 'string') {
                completion.choices[0].delta.content = data.v
                return completion
              }

              if (data.p && data.o && data.v !== undefined) {
                if (data.p.includes('/content') && data.o === 'APPEND' && typeof data.v === 'string') {
                  completion.choices[0].delta.content = data.v
                  return completion
                }
              }

              if (data.v?.response) {
                const response = data.v.response
                if (response.fragments && Array.isArray(response.fragments)) {
                  const content = response.fragments
                    .filter((f: any) => f.type === 'RESPONSE' && f.content)
                    .map((f: any) => f.content)
                    .join('')
                  if (content) {
                    completion.choices[0].delta.content = content
                    completion.id = response.message_id?.toString() || completion.id
                    return completion
                  }
                }
              }

              return null
            }

            const DATA_PREFIX = "data: "
            const onChunk = (lines: string) => {
              lines.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith(DATA_PREFIX))
                .forEach(line => {
                  const dataStr = line.substring(DATA_PREFIX.length).trim()
                  if (dataStr === '[DONE]') {
                    res.write('data: [DONE]\n\n')
                    cleanup()
                    return
                  }

                  try {
                    const data = JSON.parse(dataStr) as DeepSeekConversationData
                    const completion = transformDeepSeekToCompletion(data)
                    if (!completion || completion.choices[0].delta.content === undefined) {
                      return
                    }
                    res.write(`${DATA_PREFIX}${JSON.stringify(completion)}\n\n`)
                  } catch (e) {
                    // 忽略解析错误
                  }
                })
            }

            const cleanup = () => {
              clearTimeout(timeout)
              deepSeekEventBus.off(AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT, onChunk)
              if (!res.writableEnded) {
                res.end()
              }
            }

            const timeout = setTimeout(() => {
              cleanup()
            }, 2 * 60 * 1000)

            deepSeekEventBus.on(AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT, onChunk)

            const result = await deepSeekMonitorWindow.webContents.executeJavaScript(`
              (async () => {
                let retries = 2;
                while (retries > 0 && typeof window.automateDeepSeek !== 'function') {
                  await new Promise(r => setTimeout(r, 500));
                  retries--;
                }
                if (typeof window.automateDeepSeek !== 'function') {
                  throw new Error('window.automateDeepSeek is not defined after waiting');
                }
                return await window.automateDeepSeek(${JSON.stringify(prompt)});
              })()
            `)
            if (!result.success) {
              console.error('[DeepSeek API] Automation result:', result.error)
              res.write(`data: {"error": "${result.error}"}\n\n`)
              cleanup()
            }

            req.on('close', cleanup)
          } catch (err: any) {
            console.error('[DeepSeek API] Server Error:', err)
            if (!res.headersSent) res.writeHead(500)
            res.end(String(err))
          }
        })
        return
      }
    }

    res.writeHead(404)
    res.end('Not Found')
  })

  deepSeekServer.listen(PORT, () => {
    console.log(`[DeepSeek Server] Listening on http://localhost:${PORT}`)
  })
}

export function getDeepSeekConversationCache(): ConversationEvent[] {
  return []
}

export default {
  setupDeepSeekMonitor,
  getDeepSeekConversationCache,
  setDeepSeekSessionToken,
  openDeepSeekExternalLogin
}