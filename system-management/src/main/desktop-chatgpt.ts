import { app, BrowserWindow, session } from 'electron'
import { PassThrough } from 'node:stream'

interface ConversationEvent {
  message?: {
    id: string
    content: {
      parts: string[]
    }
  }
  // 其他可能的字段
}

const conversationCache: ConversationEvent[] = []

export function setupChatGPTMonitor() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.loadURL('https://chatgpt.com')

  const defaultSession = session.defaultSession

  defaultSession.webRequest.onBeforeRequest(
    {
      urls: ['https://chatgpt.com/backend-api/f/conversation*']
    },
    (details, callback) => {
      callback({ cancel: false })
      // request.params.messages[0].id
    }
  )

  defaultSession.webRequest.onHeadersReceived(
    {
      urls: ['https://chatgpt.com/backend-api/f/conversation*']
    },
    (details, callback) => {
      // const responseHeaders = {
      //   ...details.responseHeaders,
      //   'Content-Type': ['text/event-stream'],
      //   'Cache-Control': ['no-cache'],
      //   'Connection': ['keep-alive']
      // }
      if (details.method === 'POST' && details.statusCode === 200) {
        processResponseStream(details)
      }
      callback({
        cancel: false,
        // responseHeaders
      })
    }
  )
}

function processResponseStream(details: Electron.OnHeadersReceivedListenerDetails) {
  const defaultSession = session.defaultSession

  defaultSession.webRequest.onResponseStarted(
    { urls: [details.url] },
    (responseDetails) => {
      if (responseDetails.method === 'POST' && responseDetails.statusCode === 200) {
        const responseStream = new PassThrough()
        let buffer = ''

        responseStream.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()

          // Process SSE data
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const eventData = line.substring(6).trim()
              if (eventData !== '[DONE]') {
                try {
                  const parsedData = JSON.parse(eventData)
                  conversationCache.push(parsedData)
                  console.log('Received conversation event:', parsedData)
                } catch (e) {
                  console.error('Failed to parse SSE data:', e)
                }
              }
            }
          }
        })
        return { redirectURL: 'data:text/plain,' + encodeURIComponent(buffer) }
      }
      return {}
    }
  )
}


export function getConversationCache(): ConversationEvent[] {
  return [...conversationCache]
}

export default {
  setupChatGPTMonitor,
  getConversationCache
}