/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityNotFoundError,
  FindOneOptions,
  Repository,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'src/entities/user.entity';
import { SignUpDto } from '../auth/dto/signUp.dto';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { UpdateCompletedDto } from './dto/update-completed.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { throwError } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
    @InjectRepository(LectureTimeRecord)
    private lectureTimeRecordRepository: Repository<LectureTimeRecord>, // UserRepository 주입
    private dataSource: DataSource,
  ) {}

  async create(data: SignUpDto): Promise<User> {
    const user = this.usersRepository.create(data);

    return this.usersRepository.save(user);
  }

  async findByNameBirthId(nameBirthId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        nameBirthId,
        status: 'active',
      },
    });

    console.log(user);
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

  async updateCompleted(userId: number, lectureId: number) {
    const result = await this.lectureTimeRecordRepository.update(
      {
        userId,
        lectureId,
      },
      {
        status: true,
      },
    );
    return result;
  }

  async updateDB(data: UpdateUserDto, userId: number) {
    try {
      // const newUserInfo = await this.usersRepository.create(data);
      const userInfo = await this.usersRepository.update(
        { userId: userId },
        { ...data },
      );
    } catch (err) {
      throw new Error();
    }

    return { message: 'Success' };
  }

  async deleteUserInfo(userId: number) {
    try {
      // const newUserInfo = await this.usersRepository.create(data);
      const deleteUserInfo = await this.usersRepository.update(
        { userId: userId },
        { status: 'delete' },
      );
    } catch (err) {
      throw new Error();
    }

    return { message: 'Success' };
  }
}
