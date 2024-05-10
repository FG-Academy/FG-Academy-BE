import { IsNumber, IsString } from 'class-validator';

export class CreateQuizAnswerDto {
  @IsNumber()
  quizId: number;

  @IsNumber()
  multipleAnswer: number;

  @IsString()
  answer: string;

  // @IsOptional()
  // @IsString()
  // submittedAnswer: string | null;
}
