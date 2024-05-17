import { IsNumber, IsOptional } from 'class-validator';

export class UpdatePostDto {
  @IsNumber()
  announcementId: number;

  @IsOptional()
  title?: string;

  @IsOptional()
  content?: string;
}
