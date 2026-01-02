import { IncomingMessage, ServerResponse } from 'node:http'
import { ROUTE_PATHS, CHATGPT_CONSTANTS } from '../constants'
import { ChatgptConversationData } from '../../types/ChatgptConversationData'
import { CompletionData } from '../../types/CompletionData'
import { RouteController } from './route-controller.interface'

import { monitorWindow, eventBus } from '../desktop-chatgpt'
import { deepSeekMonitorWindow, deepSeekEventBus } from '../desktop-deepseek'

interface DeepSeekConversationData {
    v?: any
    p?: string
    o?: string
    [key: string]: any
}

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


const DEFAULT_MODEL_INFO = {
    "name": "unknown",
    "version": "1.0.0",
    "object": "model",
    "owned_by": "lotaway",
    "api_version": "v1",
}


export class HealthController implements RouteController {
    checker(req: IncomingMessage): boolean {
        return req.method === 'POST' && req.url === ROUTE_PATHS.SHOW
    }

    async handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
        res.end({ "ok": true })
    }
}

export class TagsController implements RouteController {
    checker(req: IncomingMessage): boolean {
        return req.method === 'GET' && req.url === ROUTE_PATHS.TAGS
    }

    async handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
        res.end(JSON.stringify([
            {
                ...DEFAULT_MODEL_INFO,
                name: 'chatgpt',
            },
            {
                ...DEFAULT_MODEL_INFO,
                name: 'deepseek',
            }
        ]))
    }
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
                const model = payload.model || 'chatgpt'

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

                if (model === 'chatgpt') {
                    await this.handleChatGPT(req, res, prompt)
                } else if (model === 'deepseek') {
                    await this.handleDeepSeek(req, res, prompt)
                } else {
                    res.writeHead(400)
                    res.end(JSON.stringify({ error: 'Unsupported model' }))
                }
            } catch (err: any) {
                console.error('[API] Server Error:', err)
                if (!res.headersSent) res.writeHead(500)
                res.end(String(err))
            }
        })
    }

    private async handleChatGPT(req: IncomingMessage, res: ServerResponse, prompt: string): Promise<void> {
        if (!monitorWindow) {
            res.writeHead(500)
            res.end(JSON.stringify({ error: 'ChatGPT window not initialized' }))
            return
        }

        console.log('[ChatGPT API] Processing prompt:', prompt.substring(0, Math.min(prompt.length, 200)) + '...')

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        })

        const DATA_PREFIX = "data: "
        const DATA_END = "[DONE]"
        const onChunk = (lines: string) => {
            lines.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith(DATA_PREFIX))
                .forEach(line => {
                    const dataStr = line.substring(DATA_PREFIX.length).trim()
                    if (dataStr === DATA_END) {
                        res.write(`${DATA_PREFIX}${DATA_END}\n\n`)
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
            eventBus.off(CHATGPT_CONSTANTS.SSE_CHUNK_EVENT, onChunk)
            if (!res.writableEnded) {
                res.end()
            }
        }

        const timeout = setTimeout(() => {
            cleanup()
        }, 2 * 60 * 1000)

        eventBus.on(CHATGPT_CONSTANTS.SSE_CHUNK_EVENT, onChunk)

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
            console.error('[ChatGPT API] Automation result:', result.error)
            res.write(`data: {"error": "${result.error}"}\n\n`)
            cleanup()
        }

        req.on('close', cleanup)
    }

    private async handleDeepSeek(req: IncomingMessage, res: ServerResponse, prompt: string): Promise<void> {
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

        const DATA_PREFIX = "data: "
        const DATA_END = "[DONE]"
        const onChunk = (lines: string) => {
            lines.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith(DATA_PREFIX))
                .forEach(line => {
                    const dataStr = line.substring(DATA_PREFIX.length).trim()
                    if (dataStr === DATA_END) {
                        res.write(`${DATA_PREFIX}${DATA_END}\n\n`)
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
            deepSeekEventBus.off(CHATGPT_CONSTANTS.SSE_CHUNK_EVENT, onChunk)
            if (!res.writableEnded) {
                res.end()
            }
        }

        const timeout = setTimeout(() => {
            cleanup()
        }, 2 * 60 * 1000)

        deepSeekEventBus.on(CHATGPT_CONSTANTS.SSE_CHUNK_EVENT, onChunk)

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
    }
}