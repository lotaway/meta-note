import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigController } from './controllers/config.controller';
import { AuthController } from './controllers/auth.controller';
import { StudyController } from './controllers/study.controller';
import { LLMController } from './controllers/llm.controller';
import { StudyService } from './services/study.service';
import { ScreenshotController } from './controllers/screenshot.controller';
import { ElectronService } from './services/electron.service';

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [ConfigController, AuthController, StudyController, LLMController, ScreenshotController],
    providers: [StudyService, ElectronService],
})
export class AppModule { }
