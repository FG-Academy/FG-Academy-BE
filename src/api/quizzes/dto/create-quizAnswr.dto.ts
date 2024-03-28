import { IsArray, IsNumber } from 'class-validator';

export class CreateQuizAnswerDto {
  @IsNumber()
  quizId: number;

  @IsArray()
  multipleAnswer: number[];
}
