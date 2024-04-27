import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  question: string;

  @IsString()
  quizType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizItemDto)
  quizInfo: QuizItemDto[];
}
export class QuizItemDto {
  @IsNumber()
  @Min(0)
  itemIndex: number;

  @IsString()
  item: string;

  @IsBoolean()
  isAnswer: boolean;
}
