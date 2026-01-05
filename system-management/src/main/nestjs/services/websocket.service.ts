import { Injectable } from '@nestjs/common'
import { WebSocketServer } from 'ws'
import chatGPTMonitor from '../../desktop-chatgpt'
import deepSeekMonitor from '../../desktop-deepseek'

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
                    if (message.type === 'login_request') {
                        const model = message.model || 'chatgpt'
                        console.log(`[WebSocket] Login request received for ${model}, opening external login...`)

                        if (model === 'chatgpt') {
                            chatGPTMonitor.openExternalLogin()
                        } else if (model === 'deepseek') {
                            deepSeekMonitor.openDeepSeekExternalLogin()
                        } else {
                            ws.send(JSON.stringify({
                                type: 'login_response',
                                status: 'error',
                                error: 'Unsupported model'
                            }))
                            return
                        }

                        ws.send(JSON.stringify({
                            type: 'login_response',
                            status: 'success',
                            message: `External login initiated for ${model}`,
                            model
                        }))
                    } else {
                        console.log('[WebSocket] Unknown message type:', message.type)
                        ws.send(JSON.stringify({
                            type: 'error',
                            error: 'Unknown message type'
                        }))
                    }
                } catch (err) {
                    console.log('[WebSocket] Non-JSON message or parse error:', messageStr)
                    ws.send(`Hello from ${appProtocol}!`)
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
                timestamp: Date.now(),
                supported_models: ['chatgpt', 'deepseek']
            }))
        })

        return this.wss
    }
}
