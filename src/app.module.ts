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
import { join } from 'path';
import { PostsModule } from './api/posts/posts.module';
import { QnaModule } from './api/qna/qna.module';
import { S3Module } from './common/s3';
import { UploadModule } from './api/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    S3Module,
    TypeOrmModule.forRootAsync(TypeOrmConfig),
    AuthModule,
    UsersModule,
    CacheModule.register({
      isGlobal: true,
    }),
    CoursesModule,
    QuizzesModule,
    PostsModule,
    NestjsFormDataModule.config({
      fileSystemStoragePath: join(__dirname, '..', 'public'),
      storage: FileSystemStoredFile,
      isGlobal: true,
    }),
    DashboardModule,
    AdminModule,
    QnaModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
