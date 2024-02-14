import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
  ) {}
  async signUp(user: CreateUserDto): Promise<void> {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = this.usersRepository.create({
      name: user.name,
      email: user.email,
      birthDate: new Date(user.birthDate),
      password: hashedPassword,
      phoneNumber: user.phoneNumber,
      churchName: user.churchName,
      departmentName: user.departmentName,
      position: user.position,
      yearsOfService: user.yearsOfService,
    });

    await this.usersRepository.save(newUser);
    return null;
  }
}
