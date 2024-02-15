import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './utils/logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => new LoggerMiddleware().use(req, res, next));
  app.enableCors({
    origin: 'http://localhost:3001',
  });
  await app.listen(3000);
}
bootstrap();
