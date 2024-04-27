import { IsDefined, IsNotEmpty, MinLength } from 'class-validator';

export class SignInDto {
  @IsDefined()
  @IsNotEmpty()
  nameBirthId: string;

  @IsDefined()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
