import { IsNumber } from 'class-validator';

export class DeletePostDto {
  @IsNumber({}, { each: true })
  announcementIds: number[];
}
