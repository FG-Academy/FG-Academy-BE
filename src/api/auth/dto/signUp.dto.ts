import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  MinLength,
  Validate,
} from 'class-validator';
import { IsUserAlreadyExist } from 'src/api/users/validator/isUserAlreadyExist.validator';

export class SignUpDto {
  @IsDefined()
  @IsNotEmpty()
  name: string;

  @IsDefined()
  @IsNotEmpty()
  @IsDateString()
  birthDate: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Validate(IsUserAlreadyExist)
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsDefined()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber: string;

  @IsDefined()
  @IsNotEmpty()
  churchName: string;

  @IsDefined()
  @IsNotEmpty()
  departmentName: string;

  @IsDefined()
  @IsNotEmpty()
  position: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  yearsOfService: number;
}
