import { IsBoolean, IsString } from 'class-validator';

export class FeedbackDescriptiveQuiz {
  @IsString()
  feedbackComment: string;

  @IsBoolean()
  corrected: boolean;
}
