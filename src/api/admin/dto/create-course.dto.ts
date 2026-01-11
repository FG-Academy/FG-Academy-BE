import { IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateCourseDto {
  @IsOptional()
  @IsUrl()
  thumbnailImagePath?: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  level: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  curriculum: string;

  @IsNotEmpty()
  openDate: string;

  @IsNotEmpty()
  finishDate: string;
}
