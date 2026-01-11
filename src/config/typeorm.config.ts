import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Announcement } from '../entities/announcement.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Lecture } from '../entities/lecture.entity';
import { LectureTimeRecord } from '../entities/lectureTimeRecord.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAnswer } from '../entities/quizAnswer.entity';
import { QuizSubmit } from '../entities/quizSubmit.entity';
import { Question } from 'src/entities/question.entity';
import { Answer } from 'src/entities/answer.entity';
import { Category } from 'src/entities/category.entity';
import * as path from 'path';

export const TypeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    synchronize: false,
    logging: false,
    entities: [
      User,
      Announcement,
      Course,
      Enrollment,
      Lecture,
      LectureTimeRecord,
      Quiz,
      QuizAnswer,
      QuizSubmit,
      Question,
      Answer,
      Category,
    ],
    // entities: [__dirname + '/src/entities/*.ts'],
    migrationsRun: true,
    // __dirname은 현재 파일의 위치입니다.
    // 보통 이 파일이 src/config 등에 있다면 '..'로 상위로 가서 database 폴더를 찾아야 합니다.
    // *{.ts,.js} 로 설정해야 개발(ts)과 운영(js) 모두 돌아갑니다.
    migrations: [path.join(__dirname, '..', 'database/migrations/*{.ts,.js}')],
    cli: {
      migrationsDir: 'src/database/migrations', // migration 파일을 생성할 디렉토리
    },
  }),
};
