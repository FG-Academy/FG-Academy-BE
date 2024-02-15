import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { IsUserAlreadyExist } from 'src/api/users/validator/isUserAlreadyExist.validator';

export class RegisterUserDto {
  @IsDefined()
  @IsNotEmpty()
  name: string;

  @IsDefined()
  @IsNotEmpty()
  birth: string;

  // id: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @Validate(IsUserAlreadyExist)
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNotEmpty()
  @MinLength(10)
  phoneNumber: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNotEmpty()
  churchName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNotEmpty()
  departmentName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNotEmpty()
  position: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  yearOfService: number;
}
