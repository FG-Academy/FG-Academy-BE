/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
  ) {}
  async signUp(user: CreateUserDto): Promise<Partial<CreateUserDto>> {
    const existingUser = await this.usersRepository.findOne({
      where: {
        email: user.email,
      },
    });

    // 만약 사용자가 이미 존재한다면, ConflictException 예외를 발생시킴
    if (existingUser) {
      throw new ConflictException('이미 가입한 이메일입니다.');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = this.usersRepository.create({
      ...user,
      password: hashedPassword,
    });

    await this.usersRepository.save(newUser);

    // 저장된 사용자 정보 반환 (비밀번호 제외)
    const { password, ...result } = newUser;
    return result;
  }
}
