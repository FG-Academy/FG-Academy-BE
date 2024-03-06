import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  level: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  curriculum: string;

  @IsNotEmpty()
  openDate: Date;

  @IsNotEmpty()
  finishDate: Date;
}
