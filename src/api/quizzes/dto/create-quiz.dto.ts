import { IsNumber, IsString } from 'class-validator';

export class CreateQuizDto {
  @IsNumber()
  lectureId: number;

  @IsString()
  quesetion: string;

  @IsString()
  quizType: string;

  @IsString()
  quizAnswer?: string;
}
