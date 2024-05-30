import { IsOptional } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  title?: string;

  @IsOptional()
  content?: string;
}
