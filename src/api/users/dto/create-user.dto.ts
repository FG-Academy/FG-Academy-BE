import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  birthDate: Date;

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
