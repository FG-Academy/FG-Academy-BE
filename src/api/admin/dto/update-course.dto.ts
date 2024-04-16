import { IsNotEmpty, IsOptional } from 'class-validator';
import {
  FileSystemStoredFile,
  HasMimeType,
  IsFile,
  MaxFileSize,
} from 'nestjs-form-data';

// export interface LectureDto {
//   lectureId?: number;
//   title: string;
//   videoLink: string;
//   lectureNumber: number;
// }

export class LectureDto {
  @IsOptional()
  lectureId?: number;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  videoLink: string;

  @IsNotEmpty()
  lectureNumber: number;
}

export class UpdateCourseDto {
  @IsFile()
  @IsOptional()
  @MaxFileSize(1e8, {
    message: '파일의 최대 사이즈는 100MB입니다',
  })
  @HasMimeType(['image/png', 'image/jpeg', 'image/jpg'], {
    message: (e) => {
      return `error: ${e.constraints}`;
    },
  })
  thumbnailImage: FileSystemStoredFile;

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

  // @IsNotEmpty()
  // @IsOptional()
  // lectures: LectureDto[];
  // @Transform(({ value }) => {
  //   console.log('value', value);
  //   try {
  //     return JSON.parse(value);
  //   } catch {
  //     throw new Error('Invalid JSON format for lectures');
  //   }
  // })
  // @ValidateNested({ each: true })
  // @Type(() => LectureDto)
  @IsNotEmpty()
  lectures: LectureDto[];
}
