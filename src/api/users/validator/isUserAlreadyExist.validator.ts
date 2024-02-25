import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
@Injectable()
export class IsUserAlreadyExist implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async validate(email: string): Promise<boolean> {
    console.log(email);
    const user = await this.usersRepository.findOne({
      where: {
        email,
      },
    });
    console.log(user);
    return !user;
  }

  defaultMessage(): string {
    return '이미 등록된 이메일입니다.';
  }
}
