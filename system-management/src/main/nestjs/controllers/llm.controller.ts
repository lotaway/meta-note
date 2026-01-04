import { ChatgptConversationData } from '../../../types/ChatgptConversationData'
import { CompletionData } from '../../../types/CompletionData'
import * as express from 'express'

interface DeepSeekConversationData {
    v?: any
    p?: string
    o?: string
    [key: string]: any
}

export const DEFAULT_MODEL_INFO = {
    "name": "unknown",
    "version": "1.0.0",
    "object": "model",
    "owned_by": "lotaway",
    "api_version": "v1",
}

export const transformChatgptToCompletion = (data: ChatgptConversationData): CompletionData | null => {
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

export const transformDeepSeekToCompletion = (data: DeepSeekConversationData): CompletionData | null => {
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

export class LLMController {
    getShow() {
        return { ok: true }
    }

    getTags() {
        const models = [
            { ...DEFAULT_MODEL_INFO, name: 'chatgpt' },
            { ...DEFAULT_MODEL_INFO, name: 'deepseek' }
        ]
        const localProvider = process.env.LOCAL_LLM_PROVIDER
        if (localProvider) {
            models.push({ ...DEFAULT_MODEL_INFO, name: 'local' })
        }
        return models
    }

    async chatCompletions(
        payload: any,
        res: express.Response,
        getChatGPTMonitor: () => any,
        getChatGPTEventBus: () => any,
        getDeepSeekMonitor: () => any,
        getDeepSeekEventBus: () => any
    ): Promise<void> {
        const model = payload.model || 'chatgpt'
        let prompt = payload.prompt
        if (!prompt && payload.messages && Array.isArray(payload.messages)) {
            const lastMsg = payload.messages[payload.messages.length - 1]
            prompt = lastMsg.content
        }

        if (!prompt) {
            res.status(400).json({ error: 'Missing prompt or messages' })
            return
        }

        if (model === 'chatgpt') {
            await this.handleChatGPT(prompt, payload.stream || false, res, getChatGPTMonitor, getChatGPTEventBus)
        } else if (model === 'deepseek') {
            await this.handleDeepSeek(prompt, payload.stream || false, res, getDeepSeekMonitor, getDeepSeekEventBus)
        } else if (model === 'local') {
            await this.handleLocal(prompt, payload, res)
        } else {
            res.status(400).json({ error: 'Unsupported model' })
        }
    }

    private async handleChatGPT(
        prompt: string,
        stream: boolean,
        res: express.Response,
        getChatGPTMonitor: () => any,
        getChatGPTEventBus: () => any
    ): Promise<void> {
        const monitorWindow = getChatGPTMonitor()
        if (!monitorWindow) {
            res.status(500).json({ error: 'ChatGPT window not initialized' })
            return
        }

        console.log('[ChatGPT API] Processing prompt:', prompt.substring(0, Math.min(prompt.length, 200)) + '...')

        if (stream) {
            await this.handleChatGPTStream(prompt, res, monitorWindow, getChatGPTEventBus())
        } else {
            await this.handleChatGPTNonStream(prompt, res, monitorWindow)
        }
    }

    private async handleChatGPTStream(
        prompt: string,
        res: express.Response,
        monitorWindow: any,
        eventBus: any
    ): Promise<void> {
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
            eventBus.off('sse_chunk', onChunk)
            if (!res.writableEnded) {
                res.end()
            }
        }

        const timeout = setTimeout(() => {
            cleanup()
        }, 2 * 60 * 1000)

        eventBus.on('sse_chunk', onChunk)
        res.on('close', cleanup)

        try {
            const result = await monitorWindow.webContents.executeJavaScript(`
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
            `)

            if (!result.success) {
                console.error('[ChatGPT API] Automation result:', result.error)
                res.write(`data: {"error": "${result.error}"}\n\n`)
                cleanup()
            }
        } catch (error: any) {
            console.error('[ChatGPT API] Error:', error)
            res.write(`data: {"error": "${error.message}"}\n\n`)
            cleanup()
        }
    }

    private async handleChatGPTNonStream(
        prompt: string,
        res: express.Response,
        monitorWindow: any
    ): Promise<void> {
        try {
            const result = await monitorWindow.webContents.executeJavaScript(`
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
            `)

            if (!result.success) {
                console.error('[ChatGPT API] Automation result:', result.error)
                res.status(500).json({ error: result.error })
                return
            }

            res.json({ message: 'ChatGPT completion successful', result })
        } catch (error: any) {
            console.error('[ChatGPT API] Error:', error)
            res.status(500).json({ error: error.message })
        }
    }

    private async handleDeepSeek(
        prompt: string,
        stream: boolean,
        res: express.Response,
        getDeepSeekMonitor: () => any,
        getDeepSeekEventBus: () => any
    ): Promise<void> {
        const deepSeekMonitorWindow = getDeepSeekMonitor()
        if (!deepSeekMonitorWindow) {
            res.status(500).json({ error: 'DeepSeek window not initialized' })
            return
        }

        console.log('[DeepSeek API] Processing prompt:', prompt.substring(0, Math.min(prompt.length, 200)) + '...')

        if (stream) {
            await this.handleDeepSeekStream(prompt, res, deepSeekMonitorWindow, getDeepSeekEventBus())
        } else {
            await this.handleDeepSeekNonStream(prompt, res, deepSeekMonitorWindow)
        }
    }

    private async handleDeepSeekStream(
        prompt: string,
        res: express.Response,
        monitorWindow: any,
        eventBus: any
    ): Promise<void> {
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
                        const data = JSON.parse(dataStr)
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
            eventBus.off('sse_chunk', onChunk)
            if (!res.writableEnded) {
                res.end()
            }
        }

        const timeout = setTimeout(() => {
            cleanup()
        }, 2 * 60 * 1000)

        eventBus.on('sse_chunk', onChunk)
        res.on('close', cleanup)

        try {
            const result = await monitorWindow.webContents.executeJavaScript(`
                (async () => {
                    let retries = 2;
                    while (retries > 0 && typeof window.automateDeepSeek !== 'function') {
                        await new Promise(r => setTimeout(r, 500));
                        retries--;
                    }
                    if (typeof window.automateDeepSeek !== 'function') {
                        return { success: false, error: 'window.automateDeepSeek is not defined after waiting' };
                    }
                    return await window.automateDeepSeek(${JSON.stringify(prompt)});
                })()
            `)

            if (!result.success) {
                console.error('[DeepSeek API] Automation result:', result.error)
                res.write(`data: {"error": "${result.error}"}\n\n`)
                cleanup()
            }
        } catch (error: any) {
            console.error('[DeepSeek API] Error:', error)
            res.write(`data: {"error": "${error.message}"}\n\n`)
            cleanup()
        }
    }

    private async handleDeepSeekNonStream(
        prompt: string,
        res: express.Response,
        monitorWindow: any
    ): Promise<void> {
        try {
            const result = await monitorWindow.webContents.executeJavaScript(`
                (async () => {
                    let retries = 2;
                    while (retries > 0 && typeof window.automateDeepSeek !== 'function') {
                        await new Promise(r => setTimeout(r, 500));
                        retries--;
                    }
                    if (typeof window.automateDeepSeek !== 'function') {
                        return { success: false, error: 'window.automateDeepSeek is not defined after waiting' };
                    }
                    return await window.automateDeepSeek(${JSON.stringify(prompt)});
                })()
            `)

            if (!result.success) {
                console.error('[DeepSeek API] Automation result:', result.error)
                res.status(500).json({ error: result.error })
                return
            }

            res.json({ message: 'DeepSeek completion successful', result })
        } catch (error: any) {
            console.error('[DeepSeek API] Error:', error)
            res.status(500).json({ error: error.message })
        }
    }

    private async handleLocal(prompt: string, payload: any, res: express.Response): Promise<void> {
        const localProvider = process.env.LOCAL_LLM_PROVIDER
        if (!localProvider) {
            res.status(500).json({ error: 'LOCAL_LLM_PROVIDER not configured' })
            return
        }

        try {
            const response = await fetch(`${localProvider}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                res.status(response.status).send(errorText)
                return
            }

            if (payload.stream) {
                res.writeHead(response.status, {
                    'Content-Type': response.headers.get('Content-Type') || 'application/json',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                })

                const reader = response.body?.getReader()
                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        res.write(value)
                    }
                }
                res.end()
            } else {
                const data = await response.json()
                res.json(data)
            }
        } catch (err: any) {
            console.error('[Local LLM API] Forwarding error:', err)
            res.status(500).json({ error: 'Failed to forward request to local provider' })
        }
    }
}