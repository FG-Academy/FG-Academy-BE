import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

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

export class UpdateLecturesDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @ValidateNested({ each: true })
  @Type(() => LectureDto)
  @IsNotEmpty()
  @IsOptional()
  lectures: LectureDto[];
}
