import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

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
  // @IsFile()
  // @IsOptional()
  // @MaxFileSize(1e8, {
  //   message: '파일의 최대 사이즈는 100MB입니다',
  // })
  // @HasMimeType(['image/png', 'image/jpeg', 'image/jpg'], {
  //   message: (e) => {
  //     return `error: ${e.constraints}`;
  //   },
  // })
  // thumbnailImage: FileSystemStoredFile;

  @IsNotEmpty()
  @IsOptional()
  title: string;

  @IsNotEmpty()
  @IsOptional()
  level: string;

  @IsNotEmpty()
  @IsOptional()
  description: string;

  @IsOptional()
  @IsOptional()
  curriculum: string;

  @IsNotEmpty()
  @IsOptional()
  openDate: Date;

  @IsNotEmpty()
  @IsOptional()
  finishDate: Date;
}
