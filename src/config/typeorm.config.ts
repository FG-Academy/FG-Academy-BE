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
    migrationsRun: false,
    migrations: [__dirname + '/src/database/migrations/*.ts'],
    cli: {
      migrationsDir: 'src/database/migrations', // migration 파일을 생성할 디렉토리
    },
  }),
};
