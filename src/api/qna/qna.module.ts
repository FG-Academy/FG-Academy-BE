import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Question } from 'src/entities/question.entity';
import { Answer } from 'src/entities/answer.entity';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Answer])],
  controllers: [QnaController],
  providers: [QnaService],
})
export class QnaModule {}
