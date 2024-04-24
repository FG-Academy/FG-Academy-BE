import { IsArray, IsNotEmpty } from 'class-validator';

export class DeleteCourseDto {
  @IsNotEmpty()
  @IsArray()
  courseIds: number[];
}
