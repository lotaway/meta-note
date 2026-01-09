import { Injectable } from '@nestjs/common'
import { LLMProvider } from './llm-provider.interface'

@Injectable()
export class RemoteLLMProvider implements LLMProvider {
    private providerUrl: string
    private isAvailable: boolean = false

    constructor(providerUrl: string) {
        this.providerUrl = providerUrl
    }

    async start(): Promise<void> {
        await this.checkConnection()
    }

    async checkConnection(): Promise<boolean> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2000)
            const response = await fetch(`${this.providerUrl}/api/show`, {
                method: "POST",
                signal: controller.signal
            }).catch(() => null)
            clearTimeout(timeoutId)

            const available = !!(response && response.ok)
            if (available !== this.isAvailable) {
                if (available) {
                    console.log(`[RemoteLLMProvider] Connected to external LLM provider at ${this.providerUrl}`)
                } else {
                    console.warn(`[RemoteLLMProvider] External LLM provider lost connection`)
                }
            }
            this.isAvailable = available
            return available
        } catch (e) {
            this.isAvailable = false
            return false
        }
    }

    async completion(prompt: string): Promise<any> {
        try {
            const response = await fetch(`${this.providerUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'local',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
            })

            if (response.ok) {
                const data = await response.json() as any
                return data.choices?.[0]?.message?.content || data
            }
            throw new Error(`Remote provider returned status ${response.status}`)
        } catch (err) {
            console.error('Remote provider completion failed:', err)
            throw err
        }
    }

    async embedding(content: string): Promise<number[]> {
        try {
            const response = await fetch(`${this.providerUrl}/v1/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: content,
                    model: 'text-embedding-ada-002'
                })
            })
            if (response.ok) {
                const data = await response.json() as any
                return data.data?.[0]?.embedding || data
            }
            throw new Error(`Remote provider returned status ${response.status}`)
        } catch (err) {
            console.error('Remote provider embedding failed:', err)
            throw err
        }
    }

    isStop(): boolean {
        return !this.isAvailable
    }

    async stop(): Promise<void> {
        this.isAvailable = false
    }
}
