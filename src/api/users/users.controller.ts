import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post('signUp')
  async signUp(@Body() createUserDto: CreateUserDto): Promise<void> {
    return await this.usersService.signUp(createUserDto);
  }
}
