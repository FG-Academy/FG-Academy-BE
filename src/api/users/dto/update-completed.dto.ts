import { IsNotEmpty } from 'class-validator';

export class UpdateCompletedDto {
  @IsNotEmpty()
  minutes: number;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  lectureId: number;
}
