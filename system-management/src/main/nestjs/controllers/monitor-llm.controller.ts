import * as express from 'express'
import { HttpStatus } from '@nestjs/common'
import type { EventEmitter } from 'node:events'
import { AI_CHAT_CONSTANTS, type MonitorProvider } from '../../constants'
import type { ChatgptConversationData } from '../../../types/ChatgptConversationData'
import type { CompletionData } from '../../../types/CompletionData'

interface DeepSeekConversationData {
    v?: any
    p?: string
    o?: string
    [key: string]: any
}

interface MonitorWindow {
    webContents: {
        executeJavaScript: (script: string) => Promise<any>
    }
}

interface AutomationResult {
    success: boolean
    error?: string
}

const DATA_PREFIX = 'data: '
const DATA_END = '[DONE]'
const STREAM_TIMEOUT_MS = 2 * 60 * 1000

export const transformChatgptToCompletion = (data: ChatgptConversationData): CompletionData | null => {
    if ((data as unknown as string) === DATA_END) return null

    const completion: CompletionData = {
        id: data.message?.id || (data as any).message_id,
        choices: [{ index: 0, delta: {} }],
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

export const transformDeepSeekToCompletion = (data: DeepSeekConversationData): CompletionData | null => {
    if (!data) return null

    const completion: CompletionData = {
        id: Date.now().toString(),
        choices: [{ index: 0, delta: {} }],
    }

    if (typeof data.v === 'string') {
        completion.choices[0].delta.content = data.v
        return completion
    }

    if (data.p && data.o && typeof data.v === 'string' && data.p.includes('/content') && data.o === 'APPEND') {
        completion.choices[0].delta.content = data.v
        return completion
    }

    if (data.v?.response) {
        const response = data.v.response
        if (response.fragments && Array.isArray(response.fragments)) {
            const content = response.fragments
                .filter((fragment: any) => fragment.type === 'RESPONSE' && fragment.content)
                .map((fragment: any) => fragment.content)
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

const automationScript = (prompt: string): string => `
    (async () => {
        let retries = 2;
        while (retries > 0 && typeof window.automateChat !== 'function') {
            await new Promise(r => setTimeout(r, 500));
            retries--;
        }
        if (typeof window.automateChat !== 'function') {
            return { success: false, error: 'window.automateChat is not defined after waiting' };
        }
        return await window.automateChat(${JSON.stringify(prompt)});
    })()
`

export class MonitorLLMController {
    constructor(
        private readonly getChatGPTMonitor: () => MonitorWindow | null,
        private readonly getChatGPTEventBus: () => EventEmitter,
        private readonly getDeepSeekMonitor: () => MonitorWindow | null,
        private readonly getDeepSeekEventBus: () => EventEmitter,
    ) { }

    async chatCompletions(req: express.Request, res: express.Response, model: MonitorProvider): Promise<void> {
        try {
            const payload = req.body ?? {}
            const prompt = this.extractPrompt(payload)
            if (!prompt) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing prompt or messages' })
                return
            }

            const isChatGPT = model === 'chatgpt'
            const monitor = isChatGPT ? this.getChatGPTMonitor() : this.getDeepSeekMonitor()
            if (!monitor) {
                res.status(HttpStatus.SERVICE_UNAVAILABLE).json({ error: `${model} window not initialized` })
                return
            }

            const eventBus = isChatGPT ? this.getChatGPTEventBus() : this.getDeepSeekEventBus()
            const transform = isChatGPT ? transformChatgptToCompletion : transformDeepSeekToCompletion

            if (payload.stream === true) {
                await this.handleStream(monitor, eventBus, transform, prompt, res)
            } else {
                await this.handleNonStream(monitor, prompt, res)
            }
        } catch (error: any) {
            console.error('[Monitor LLM] Chat completion failed:', error)
            if (!res.headersSent) {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
            } else {
                res.end()
            }
        }
    }

    private extractPrompt(payload: any): string {
        if (typeof payload.prompt === 'string' && payload.prompt.length > 0) return payload.prompt
        if (Array.isArray(payload.messages) && payload.messages.length > 0) {
            const last = payload.messages[payload.messages.length - 1]
            if (typeof last?.content === 'string') return last.content
        }
        return ''
    }

    private async handleNonStream(monitor: MonitorWindow, prompt: string, res: express.Response): Promise<void> {
        const result = await monitor.webContents.executeJavaScript(automationScript(prompt)) as AutomationResult
        if (!result || result.success === false) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: result?.error || 'Automation did not return a result' })
            return
        }
        res.json({ message: 'Monitor completion successful', result })
    }

    private async handleStream(
        monitor: MonitorWindow,
        eventBus: EventEmitter,
        transform: (data: any) => CompletionData | null,
        prompt: string,
        res: express.Response,
    ): Promise<void> {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        })

        let timeout: ReturnType<typeof setTimeout> | undefined
        let cleanup: () => void
        const channel = AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT

        const onChunk = (lines: string): void => {
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
                        const completion = transform(JSON.parse(dataStr))
                        if (!completion || completion.choices[0].delta.content === undefined) return
                        res.write(`${DATA_PREFIX}${JSON.stringify(completion)}\n\n`)
                    } catch {
                        // Ignore malformed SSE payloads.
                    }
                })
        }

        cleanup = (): void => {
            if (timeout) clearTimeout(timeout)
            eventBus.off(channel, onChunk)
            if (!res.writableEnded) res.end()
        }

        timeout = setTimeout(cleanup, STREAM_TIMEOUT_MS)
        eventBus.on(channel, onChunk)
        res.on('close', cleanup)

        try {
            const result = await monitor.webContents.executeJavaScript(automationScript(prompt)) as AutomationResult
            if (!result || result.success === false) {
                res.write(`${DATA_PREFIX}${JSON.stringify({ error: result?.error || 'Automation did not return a result' })}\n\n`)
                cleanup()
            }
        } catch (error: any) {
            res.write(`${DATA_PREFIX}${JSON.stringify({ error: error.message })}\n\n`)
            cleanup()
        }
    }
}
