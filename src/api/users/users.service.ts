/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, FindOneOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { SignUpDto } from '../auth/dto/signUp.dto';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
    @InjectRepository(LectureTimeRecord)
    private lectureTimeRecordRepository: Repository<LectureTimeRecord>, // UserRepository 주입
  ) {}

  async create(data: SignUpDto): Promise<User> {
    const user = this.usersRepository.create(data);

    return this.usersRepository.save(user);
  }

  async findByNameBirthId(nameBirthId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        nameBirthId,
      },
    });
    return user;
  }

  async findOne(where: FindOneOptions<User>): Promise<User> {
    const user = await this.usersRepository.findOne(where);

    if (!user) {
      throw new NotFoundException(
        `There isn't any user with identifier: ${where}`,
      );
    }

    return user;
  }

  async saveMinutes(minutes: number, userId: number, lectureId: number) {
    // const result = await this.lectureTimeRecordRepository.update(
    //   {
    //     lectureId,
    //     userId,
    //   },
    //   {
    //     playTime: minutes,
    //   },
    // );
    const newRecord = await this.lectureTimeRecordRepository.create({
      lectureId,
      userId,
      playTime: minutes,
    });
    const result = await this.lectureTimeRecordRepository.upsert(newRecord, [
      'lectureId',
      'userId',
    ]);

    return true;
  }
}
