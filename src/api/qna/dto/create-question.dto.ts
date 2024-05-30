import { IsNotEmpty } from 'class-validator';

export class CreateQuestoinDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  content: string;
}
