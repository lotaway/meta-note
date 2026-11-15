import { Injectable } from '@nestjs/common'
import { WebSocketServer } from 'ws'

@Injectable()
export class WebSocketService {
    private wss: WebSocketServer | null = null

    setup(port: number, appProtocol: string) {
        if (this.wss) return this.wss

        this.wss = new WebSocketServer({ port })
        console.log(`WebSocketServer started on port ${port}`)

        this.wss.on('connection', ws => {
            const socket = (ws as any)._socket
            if (socket && socket.remoteAddress && socket.remotePort) {
                console.log(`[WebSocket] New connection from ${socket.remoteAddress}:${socket.remotePort}`)
            } else {
                console.log('[WebSocket] New connection established')
            }

            ws.on('message', (data: object) => {
                const messageStr = data.toString()
                console.log('[WebSocket] Received:', messageStr)

                try {
                    const message = JSON.parse(messageStr)

                    switch (message.type) {
                        case 'hello':
                            ws.send(JSON.stringify({
                                type: 'hello_ack',
                                status: 'ok',
                                code: 200,
                                timestamp: Date.now()
                            }))
                            break

                        case 'ping':
                            ws.send(JSON.stringify({
                                type: 'pong',
                                status: 'ok',
                                code: 200,
                                timestamp: Date.now()
                            }))
                            break

                        case 'subscribe':
                            ws.send(JSON.stringify({
                                type: 'subscribe_ack',
                                status: 'ok',
                                code: 200,
                                channels: message.channels || [],
                                timestamp: Date.now()
                            }))
                            break

                        case 'unsubscribe':
                            ws.send(JSON.stringify({
                                type: 'unsubscribe_ack',
                                status: 'ok',
                                code: 200,
                                channels: message.channels || [],
                                timestamp: Date.now()
                            }))
                            break

                        default:
                            console.log('[WebSocket] Unknown message type:', message.type)
                            ws.send(JSON.stringify({
                                type: 'error',
                                status: 'error',
                                code: 4001,
                                error: `Unknown message type: ${message.type}`,
                                timestamp: Date.now()
                            }))
                    }
                } catch (err) {
                    console.log('[WebSocket] Non-JSON message or parse error:', messageStr)
                    ws.send(JSON.stringify({
                        type: 'error',
                        status: 'error',
                        code: 4000,
                        error: 'Invalid message format: expected JSON',
                        timestamp: Date.now()
                    }))
                }
            })

            ws.on('error', (error) => {
                console.error('[WebSocket] Connection error:', error)
            })

            ws.on('close', () => {
                console.log('[WebSocket] Connection closed')
            })

            ws.send(JSON.stringify({
                type: 'welcome',
                protocol: appProtocol,
                timestamp: Date.now()
            }))
        })

        return this.wss
    }
}
