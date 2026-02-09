import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { StudyService } from './services/study.service'
import { LLMService } from './services/llm.service'
import { MediaService } from './services/media.service'
import { WebSocketService } from './services/websocket.service'
import { NoteService } from './services/note.service'
import { NoteController } from './controllers/note.controller'
import { BilibiliDownloader } from './services/providers/bilibili.downloader'
import { YoutubeDownloader } from './services/providers/youtube.downloader'
import { DouyinDownloader } from './services/providers/douyin.downloader'
import { KuaishouDownloader } from './services/providers/kuaishou.downloader'
import { UniversalDownloader } from './services/providers/universal.downloader'
import { VideoProcessor } from './services/providers/video-processor'
import { Transcriber } from './services/providers/transcriber'
import { LocalLLMProvider } from './services/providers/local-llm-provider'
import { RemoteLLMProvider } from './services/providers/remote-llm-provider'
import { LLMProviderStrategy } from './services/providers/llm-provider-strategy'
import { LLMProvider } from './services/providers/llm-provider.interface'

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [NoteController],
    providers: [
        StudyService,
        MediaService,
        WebSocketService,
        NoteService,
        BilibiliDownloader,
        YoutubeDownloader,
        DouyinDownloader,
        KuaishouDownloader,
        UniversalDownloader,
        VideoProcessor,
        Transcriber,
        LocalLLMProvider,
        {
            provide: 'LLM_PROVIDERS',
            useFactory: (localProvider: LocalLLMProvider): LLMProvider[] => {
                const providers: LLMProvider[] = []
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
            useFactory: (providers: LLMProvider[]) => {
                return new LLMProviderStrategy(providers)
            },
            inject: ['LLM_PROVIDERS']
        },
        LLMService
    ],
})
export class AppModule { }
