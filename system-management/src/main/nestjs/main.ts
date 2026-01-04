import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

export async function bootstrapNestJS() {
    const app = await NestFactory.createApplicationContext(AppModule)
    console.log('NestJS application context created (no HTTP server)')
    return app
}
