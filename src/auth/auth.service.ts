import { RegisterUserDto } from './dto/registerUser.dto';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    // private readonly jwtService: JwtService,
  ) {}
  async register(registerUserDto: RegisterUserDto) {
    const user = await this.usersService.create(registerUserDto);

    return user;
  }
}
