import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/registerUser.dto';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}
  @Post('signUp')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.signUp(registerUserDto);
  }
}
