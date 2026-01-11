import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class LectureDto {
  @IsOptional()
  @Expose()
  lectureId?: number;

  @IsNotEmpty()
  @Expose()
  title: string;

  @IsNotEmpty()
  @Expose()
  videoLink: string;

  @IsNotEmpty()
  @Expose()
  lectureNumber: number;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsUrl()
  thumbnailImagePath?: string;

  @IsNotEmpty()
  @IsOptional()
  title: string;

  @IsNotEmpty()
  @IsOptional()
  status: string;

  @IsNotEmpty()
  @IsOptional()
  level: string;

  @IsNotEmpty()
  @IsOptional()
  description: string;

  @IsOptional()
  curriculum: string;

  @IsNotEmpty()
  @IsOptional()
  openDate: Date;

  @IsNotEmpty()
  @IsOptional()
  finishDate: Date;
}
