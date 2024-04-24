import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCourseDto {
  // @IsNotEmpty()
  // thumbnailImage: string;

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
