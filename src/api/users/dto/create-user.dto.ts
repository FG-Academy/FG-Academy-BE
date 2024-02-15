import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  // @Validate(IsUserAlreadyExist)
  email: string;

  @IsNotEmpty()
  birthDate: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  churchName: string;

  @IsNotEmpty()
  departmentName: string;

  @IsNotEmpty()
  position: string;

  @IsNotEmpty()
  yearsOfService: number;
}
