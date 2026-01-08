import { Injectable, OnModuleDestroy, Inject } from '@nestjs/common'
import { LLMProviderStrategy } from './providers/llm-provider-strategy'

@Injectable()
export class LLMService implements OnModuleDestroy {
    constructor(@Inject(LLMProviderStrategy) private providerStrategy: LLMProviderStrategy) { }

    async onModuleDestroy() {
        await this.stop()
    }

    async start() {
        await this.providerStrategy.start()
    }

    async checkConnection(): Promise<boolean> {
        return await this.providerStrategy.checkConnection()
    }

    async stop() {
        await this.providerStrategy.stop()
    }

    async completion(prompt: string) {
        const provider = await this.providerStrategy.getActiveProvider()
        try {
            return await provider.completion(prompt)
        } catch (error) {
            const fallbackProvider = await this.providerStrategy.getNextProvider(provider)
            if (fallbackProvider) {
                console.error('Primary provider failed, falling back:', error)
                return await fallbackProvider.completion(prompt)
            }
            throw error
        }
    }

    async embedding(content: string) {
        const provider = await this.providerStrategy.getActiveProvider()
        try {
            return await provider.embedding(content)
        } catch (error) {
            const fallbackProvider = await this.providerStrategy.getNextProvider(provider)
            if (fallbackProvider) {
                console.error('Primary provider failed, falling back:', error)
                return await fallbackProvider.embedding(content)
            }
            throw error
        }
    }
}
