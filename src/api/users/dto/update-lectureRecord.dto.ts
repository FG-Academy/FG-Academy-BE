import { IsNotEmpty } from 'class-validator';

export class UpdateLectureRecordDto {
  @IsNotEmpty()
  minutes: number;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  lectureId: number;
}
