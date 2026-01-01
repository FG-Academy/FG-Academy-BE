import { IsString, IsIn } from 'class-validator';

export class GeneratePresignedUrlDto {
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/gif'])
  contentType: string;
}
