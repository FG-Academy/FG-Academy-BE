import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post('signUp')
  @HttpCode(201)
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signUp(@Body() createUserDto: CreateUserDto): Promise<any> {
    console.log(createUserDto);

    await this.usersService.signUp(createUserDto);

    return { message: '회원가입 성공' };
  }
}
