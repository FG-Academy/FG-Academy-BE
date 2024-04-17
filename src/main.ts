import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './utils/logger.middleware';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use((req, res, next) => new LoggerMiddleware().use(req, res, next));
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });
  // app.useStaticAssets(join(__dirname, '..', 'public'));
  // app.useGlobalFilters(new GlobalExceptionFilter());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
