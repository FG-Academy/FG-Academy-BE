import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Announcement } from '../entities/announcement.entity';
import { Course } from '../entities/course.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Lecture } from '../entities/lecture.entity';
import { LectureTimeRecord } from '../entities/lectureTimeRecord.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAnswer } from '../entities/quizAnswer.entity';
import { QuizSubmit } from '../entities/quizSubmit.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Category } from '../entities/category.entity';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
