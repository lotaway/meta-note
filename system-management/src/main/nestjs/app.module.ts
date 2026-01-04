import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { StudyService } from './services/study.service'
import { ElectronService } from './services/electron.service'

@Module({
    imports: [ConfigModule.forRoot()],
    controllers: [],
    providers: [StudyService, ElectronService],
})
export class AppModule { }
