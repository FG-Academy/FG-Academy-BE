import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateLectureDto {
  @IsNumber()
  lectureNumber: number;

  @IsString()
  title: string;

  @IsString()
  videoLink: string;

  @IsString()
  @IsOptional()
  attachmentFile?: string;

  @IsNumber()
  courseId: number; // 강의가 속한 과정의 ID
}
