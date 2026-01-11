import { IsString, IsIn } from 'class-validator';

export class GeneratePresignedUrlDto {
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  contentType: string;
}
