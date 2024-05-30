import { IsString } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  content: string;
}
