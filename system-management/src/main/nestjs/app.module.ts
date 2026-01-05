import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { StudyService } from './services/study.service'
import { LLMService } from './services/llm.service'
import { MediaService } from './services/media.service'
import { WebSocketService } from './services/websocket.service'

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [],
    providers: [StudyService, LLMService, MediaService, WebSocketService],
})
export class AppModule { }
