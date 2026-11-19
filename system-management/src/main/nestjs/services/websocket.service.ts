import { Injectable } from '@nestjs/common'
import { WebSocketServer } from 'ws'

interface IncomingMessage {
  type?: string
  channels?: unknown[]
}

function okResponse(type: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { type, status: 'ok', code: 200, timestamp: Date.now(), ...extra }
}

export function buildMessageResponse(message: IncomingMessage): Record<string, unknown> {
  switch (message.type) {
    case 'hello':
      return okResponse('hello_ack')
    case 'ping':
      return okResponse('pong')
    case 'subscribe':
      return okResponse('subscribe_ack', { channels: message.channels || [] })
    case 'unsubscribe':
      return okResponse('unsubscribe_ack', { channels: message.channels || [] })
    default:
      return {
        type: 'error',
        status: 'error',
        code: 4001,
        error: `Unknown message type: ${message.type}`,
        timestamp: Date.now(),
      }
  }
}

function invalidFormatResponse(): Record<string, unknown> {
  return {
    type: 'error',
    status: 'error',
    code: 4000,
    error: 'Invalid message format: expected JSON',
    timestamp: Date.now(),
  }
}

@Injectable()
export class WebSocketService {
    private wss: WebSocketServer | null = null

    setup(port: number, appProtocol: string) {
        if (this.wss) return this.wss

        this.wss = new WebSocketServer({ port })
        console.log(`WebSocketServer started on port ${port}`)
        this.wss.on('connection', ws => this.handleConnection(ws, appProtocol))

        return this.wss
    }

    private handleConnection(ws: import('ws').WebSocket, appProtocol: string): void {
        this.logConnection(ws)
        ws.on('message', (data: object) => {
            const messageStr = data.toString()
            console.log('[WebSocket] Received:', messageStr)
            ws.send(JSON.stringify(this.parseAndRespond(messageStr)))
        })
        ws.on('error', (error) => console.error('[WebSocket] Connection error:', error))
        ws.on('close', () => console.log('[WebSocket] Connection closed'))
        ws.send(JSON.stringify({ type: 'welcome', protocol: appProtocol, timestamp: Date.now() }))
    }

    private logConnection(ws: import('ws').WebSocket): void {
        const socket = (ws as any)._socket
        if (socket && socket.remoteAddress && socket.remotePort) {
            console.log(`[WebSocket] New connection from ${socket.remoteAddress}:${socket.remotePort}`)
        } else {
            console.log('[WebSocket] New connection established')
        }
    }

    private parseAndRespond(messageStr: string): Record<string, unknown> {
        try {
            return buildMessageResponse(JSON.parse(messageStr))
        } catch {
            console.log('[WebSocket] Non-JSON message or parse error:', messageStr)
            return invalidFormatResponse()
        }
    }
}
