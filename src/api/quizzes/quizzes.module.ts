import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizAnswer } from 'src/entities/quizAnswer.entity';
import { Course } from 'src/entities/course.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Quiz, QuizAnswer, QuizSubmit])],
  controllers: [QuizzesController],
  providers: [QuizzesService],
})
export class QuizzesModule {}
