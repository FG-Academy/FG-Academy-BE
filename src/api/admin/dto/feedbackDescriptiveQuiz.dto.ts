import { IsBoolean, IsOptional } from 'class-validator';

export class FeedbackDescriptiveQuiz {
  @IsOptional()
  feedbackComment: string;

  @IsBoolean()
  corrected: boolean;
}
