import { IsNumber, IsString } from 'class-validator';

export class FeedbackDto {
  @IsString()
  feedbackComment: string;

  @IsNumber()
  isAnswer: number;
}
