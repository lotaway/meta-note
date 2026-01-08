import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { StudyService } from './services/study.service'
import { LLMService } from './services/llm.service'
import { MediaService } from './services/media.service'
import { WebSocketService } from './services/websocket.service'
import { LocalLLMProvider } from './services/providers/local-llm-provider'
import { RemoteLLMProvider } from './services/providers/remote-llm-provider'
import { LLMProviderStrategy } from './services/providers/llm-provider-strategy'

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [],
    providers: [
        StudyService,
        MediaService,
        WebSocketService,
        LocalLLMProvider,
        {
            provide: 'LLM_PROVIDERS',
            useFactory: (localProvider: LocalLLMProvider) => {
                const providers = []
                const providerUrl = process.env.LOCAL_LLM_PROVIDER
                if (providerUrl) {
                    providers.push(new RemoteLLMProvider(providerUrl))
                }
                providers.push(localProvider)
                return providers
            },
            inject: [LocalLLMProvider]
        },
        {
            provide: LLMProviderStrategy,
            useFactory: (providers: any[]) => {
                return new LLMProviderStrategy(providers)
            },
            inject: ['LLM_PROVIDERS']
        },
        LLMService
    ],
})
export class AppModule { }
