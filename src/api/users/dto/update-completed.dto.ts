import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateCompletedDto {
  @IsNotEmpty()
  @IsNumber()
  lectureId: number;
}
