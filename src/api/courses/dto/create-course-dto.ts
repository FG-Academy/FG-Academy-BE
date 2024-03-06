import { IsNotEmpty, IsOptional } from 'class-validator';
import {
  MemoryStoredFile,
  HasMimeType,
  IsFiles,
  MaxFileSize,
} from 'nestjs-form-data';
export class CreateCourseDto {
  @IsFiles({ each: true })
  @MaxFileSize(2e7, {
    each: true,
    message: '파일의 최대 사이즈는 20MB입니다',
  })
  @HasMimeType(['image/png', 'image/jpeg', 'image/jpg'], {
    each: true,
    message: (e) => {
      return `error: ${e.constraints}`;
    },
  })
  thumbnailImage: MemoryStoredFile;

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
