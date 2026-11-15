import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LLMService } from './services/llm.service'
import { MediaService } from './services/media.service'
import { WebSocketService } from './services/websocket.service'
import { TTSService } from './services/tts.service'
import { TTSController } from './controllers/tts.controller'
import { LocalLLMProvider } from './services/providers/local-llm-provider'
import { RemoteLLMProvider } from './services/providers/remote-llm-provider'
import { LLMProviderStrategy } from './services/providers/llm-provider-strategy'
import { LLMProvider } from './services/providers/llm-provider.interface'
import { NoteService } from './services/note.service'
import { StudyService } from './services/study.service'
import { UniversalDownloader } from './services/providers/universal.downloader'
import { BilibiliDownloader } from './services/providers/bilibili.downloader'
import { YoutubeDownloader } from './services/providers/youtube.downloader'
import { DouyinDownloader } from './services/providers/douyin.downloader'
import { KuaishouDownloader } from './services/providers/kuaishou.downloader'
import { VideoProcessor } from './services/providers/video-processor'
import { Transcriber } from './services/providers/transcriber'

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [TTSController],
    providers: [
        MediaService,
        WebSocketService,
        TTSService,
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
        LLMService,
        BilibiliDownloader,
        YoutubeDownloader,
        DouyinDownloader,
        KuaishouDownloader,
        UniversalDownloader,
        VideoProcessor,
        Transcriber,
        NoteService,
        StudyService
    ],
})
export class AppModule { }
