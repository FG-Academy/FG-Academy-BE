import { IsNotEmpty, IsOptional } from 'class-validator';
import {
  FileSystemStoredFile,
  HasMimeType,
  IsFile,
  MaxFileSize,
} from 'nestjs-form-data';
export class CreateCourseDto {
  @IsFile()
  @MaxFileSize(2e7, {
    message: '파일의 최대 사이즈는 20MB입니다',
  })
  @HasMimeType(['image/png', 'image/jpeg', 'image/jpg'], {
    message: (e) => {
      return `error: ${e.constraints}`;
    },
  })
  thumbnailImage: FileSystemStoredFile;

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
