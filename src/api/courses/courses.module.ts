import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Lecture } from 'src/entities/lecture.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Lecture,
      Enrollment,
      LectureTimeRecord,
      Quiz,
      QuizSubmit,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
