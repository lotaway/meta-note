import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { LLMProvider } from './llm-provider.interface'

@Injectable()
export class LLMProviderStrategy implements OnModuleDestroy {
    private providers: LLMProvider[]
    private checkInterval: NodeJS.Timeout | null = null

    constructor(providers: LLMProvider[]) {
        this.providers = providers
    }

    async onModuleDestroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval)
        }
    }

    async start() {
        if (this.providers.length > 1) {
            await this.checkProviders()
            this.checkInterval = setInterval(() => {
                this.checkProviders()
            }, 30000)
        }
    }

    private async checkProviders() {
        for (let i = 0; i < this.providers.length - 1; i++) {
            const provider = this.providers[i]
            const isAvailable = await provider.checkConnection()
            if (isAvailable) {
                const fallbackProvider = this.providers[this.providers.length - 1]
                if (fallbackProvider.stop) {
                    console.log('[LLMProviderStrategy] Stopping fallback provider as primary provider is available')
                    await fallbackProvider.stop()
                }
                break
            }
        }
    }

    async getActiveProvider(): Promise<LLMProvider> {
        for (const provider of this.providers) {
            const isAvailable = await provider.checkConnection()
            if (isAvailable) {
                return provider
            }
        }
        return this.providers[this.providers.length - 1]
    }

    async getNextProvider(currentProvider: LLMProvider): Promise<LLMProvider | null> {
        const currentIndex = this.providers.indexOf(currentProvider)
        if (currentIndex === -1 || currentIndex === this.providers.length - 1) {
            return null
        }
        for (let i = currentIndex + 1; i < this.providers.length; i++) {
            const provider = this.providers[i]
            const isAvailable = await provider.checkConnection()
            if (isAvailable) {
                return provider
            }
        }
        return this.providers[this.providers.length - 1]
    }

    async checkConnection(): Promise<boolean> {
        for (const provider of this.providers) {
            const isAvailable = await provider.checkConnection()
            if (isAvailable) return true
        }
        return false
    }

    async stop() {
        for (const provider of this.providers) {
            if (provider.stop) {
                await provider.stop()
            }
        }
    }
}
