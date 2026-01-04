import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function bootstrapNestJS() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    // Add global validation pipe if needed
    // app.useGlobalPipes(new ValidationPipe());

    const port = process.env.WEB_SERVER_PORT ? parseInt(process.env.WEB_SERVER_PORT) : 5051;
    await app.listen(port);
    console.log(`NestJS application is running on port ${port}`);
    return app;
}
