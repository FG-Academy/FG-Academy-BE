import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { LoggerMiddleware } from './utils/logger.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import { CoursesModule } from './api/courses/courses.module';
import { NestjsFormDataModule, FileSystemStoredFile } from 'nestjs-form-data';
import { QuizzesModule } from './api/quizzes/quizzes.module';
import { DashboardModule } from './api/dashboard/dashboard.module';
import { AdminModule } from './api/admin/admin.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveStaticOptions: { index: false, redirect: false },
      renderPath: '/asset',
    }),
    TypeOrmModule.forRootAsync(TypeOrmConfig),
    AuthModule,
    UsersModule,
    CacheModule.register({
      isGlobal: true,
    }),
    CoursesModule,
    QuizzesModule,
    NestjsFormDataModule.config({
      fileSystemStoragePath: join(__dirname, '..', 'public'),
      storage: FileSystemStoredFile,
      isGlobal: true,
    }),
    DashboardModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
