import { useEffect, useRef, useState, useCallback } from 'react'

type MessageHandler = (data: any) => void
type ConnectionHandler = () => void

interface WebSocketServiceOptions {
  url: string
  onOpen?: ConnectionHandler
  onClose?: ConnectionHandler
  onError?: (error: Event) => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

class DigitalTwinWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private handlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null
  private onOpenCallback?: ConnectionHandler
  private onCloseCallback?: ConnectionHandler
  private onErrorCallback?: (error: Event) => void
  private isManualClose = false

  constructor(options: WebSocketServiceOptions) {
    this.url = options.url
    this.onOpenCallback = options.onOpen
    this.onCloseCallback = options.onClose
    this.onErrorCallback = options.onError
    this.maxReconnectAttempts = options.reconnectAttempts || 5
    this.reconnectInterval = options.reconnectInterval || 3000
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected')
        this.reconnectAttempts = 0
        this.onOpenCallback?.()
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.onCloseCallback?.()
        if (!this.isManualClose) {
          this.attemptReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        this.onErrorCallback?.(error)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          const { type, data } = message
          
          // Handle subscribed messages
          const handlers = this.handlers.get(type) || []
          handlers.forEach(handler => handler(data))
          
          // Also notify wildcard handlers
          const wildcardHandlers = this.handlers.get('*') || []
          wildcardHandlers.forEach(handler => handler(message))
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e)
        }
      }
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts})`)
      this.reconnectTimerId = setTimeout(() => this.connect(), this.reconnectInterval)
    } else {
      console.error('[WebSocket] Max reconnection attempts reached')
    }
  }

  disconnect() {
    this.isManualClose = true
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId)
      this.reconnectTimerId = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    } else {
      console.warn('[WebSocket] Cannot send message, not connected')
    }
  }

  subscribe(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type) || []
    handlers.push(handler)
    this.handlers.set(type, handlers)
  }

  unsubscribe(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type) || []
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// React Hook for WebSocket
export function useDigitalTwinWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)
  const wsRef = useRef<DigitalTwinWebSocket | null>(null)

  useEffect(() => {
    const ws = new DigitalTwinWebSocket({
      url,
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
      onError: (err) => setError(err)
    })

    ws.connect()
    wsRef.current = ws

    return () => {
      ws.disconnect()
    }
  }, [url])

  const send = useCallback((type: string, data: any) => {
    wsRef.current?.send(type, data)
  }, [])

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    wsRef.current?.subscribe(type, handler)
    return () => wsRef.current?.unsubscribe(type, handler)
  }, [])

  return { isConnected, error, send, subscribe }
}

export { DigitalTwinWebSocket }
export type { MessageHandler, WebSocketServiceOptions }