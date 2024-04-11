import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { User } from 'src/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Lecture,
      LectureTimeRecord,
      User,
      Enrollment,
      Quiz,
      QuizSubmit,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
