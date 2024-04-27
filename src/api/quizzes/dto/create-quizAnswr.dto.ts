import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuizAnswerDto {
  @IsNumber()
  quizId: number;

  @IsArray()
  multipleAnswer: number[];

  @IsOptional()
  @IsString()
  submittedAnswer: string | null;
}
