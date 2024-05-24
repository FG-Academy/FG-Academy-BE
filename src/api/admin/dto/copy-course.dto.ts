import { IsArray, IsNotEmpty } from 'class-validator';

export class CopyCourseDto {
  @IsNotEmpty()
  @IsArray()
  courseIds: number[];
}
