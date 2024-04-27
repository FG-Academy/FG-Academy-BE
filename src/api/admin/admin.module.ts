import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizAnswer } from 'src/entities/quizAnswer.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { Course } from 'src/entities/course.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { Announcement } from 'src/entities/announcement.entity';
import { Enrollment } from 'src/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LectureTimeRecord,
      Quiz,
      QuizAnswer,
      QuizSubmit,
      Course,
      Lecture,
      Announcement,
      Enrollment,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
