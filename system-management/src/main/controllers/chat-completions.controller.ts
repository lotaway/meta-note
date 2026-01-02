import { IncomingMessage, ServerResponse } from 'node:http'
import { ROUTE_PATHS } from '../constants'
import { ChatgptConversationData } from '../../types/ChatgptConversationData'
import { CompletionData } from '../../types/CompletionData'
import { RouteController } from './route-controller.interface'

import { monitorWindow, eventBus } from '../desktop-chatgpt'

const transformChatgptToCompletion = (data: ChatgptConversationData): CompletionData | null => {
    if ((data as any) === '[DONE]') return null

    const completion: CompletionData = {
        id: data.message?.id || (data as any).message_id,
        choices: [{
            index: 0,
            delta: {}
        }]
    }

    if (data.p?.includes('/message/content/parts/0') && data.o === 'append' && typeof data.v === 'string') {
        completion.choices[0].delta.content = data.v
        return completion
    }

    if (!data.p && !data.o && typeof data.v === 'string') {
        completion.choices[0].delta.content = data.v
        return completion
    }

    if (data.v?.message?.content?.parts?.[0] && data.v.message.author.role === 'assistant') {
        completion.choices[0].delta.content = data.v.message.content.parts[0]
        completion.id = data.v.message.id
        return completion
    }

    return null
}

export class ChatCompletionsController implements RouteController {
    checker(req: IncomingMessage): boolean {
        return req.method === 'POST' && req.url === ROUTE_PATHS.CHAT_COMPLETIONS
    }

    async handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
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

                console.log('[API] Processing prompt:', prompt.substring(0, Math.min(prompt.length, 200)) + '...')

                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                })

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
                                const data = JSON.parse(dataStr) as ChatgptConversationData
                                const completion = transformChatgptToCompletion(data)
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
                    eventBus.off('sse-chunk', onChunk)
                    if (!res.writableEnded) {
                        res.end()
                    }
                }

                const timeout = setTimeout(() => {
                    cleanup()
                }, 2 * 60 * 1000)

                eventBus.on('sse-chunk', onChunk)

                const result = await monitorWindow.webContents.executeJavaScript(`
                    (async () => {
                        let retries = 2;
                        while (retries > 0 && typeof window.automateChat !== 'function') {
                            await new Promise(r => setTimeout(r, 500));
                            retries--;
                        }
                        if (typeof window.automateChat !== 'function') {
                            throw new Error('window.automateChat is not defined after waiting');
                        }
                        return await window.automateChat(${JSON.stringify(prompt)});
                    })()
                `)
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
    }
}