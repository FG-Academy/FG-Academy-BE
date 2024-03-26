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
import { UpdatePasswordDto } from './dto/update-password.dto';
import { v4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
    @InjectRepository(LectureTimeRecord)
    private lectureTimeRecordRepository: Repository<LectureTimeRecord>, // UserRepository 주입
    private dataSource: DataSource,
    private readonly mailerService: MailerService,
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

  async findEmailExist(email: string) {
    const user = await this.usersRepository.findOne({
      where: {
        email,
      },
    });

    return user;
  }

  async sendEmail(email: string) {
    const verficationCode = v4().substring(0, 6);

    await this.mailerService.sendMail({
      to: email,
      subject: '꽃동산 아카데미 비밀번호 재설정 인증코드',
      text: `꽃동산 아카데미 이메일 인증코드는

      ${verficationCode} 
      
      입니다.`,
      html: `<p>인증 코드: ${verficationCode} </p>`,
    });

    return verficationCode;
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto) {
    const { password, email } = updatePasswordDto;
    const salt = await bcrypt.genSalt();
    let newPassword;
    if (!/^\$2[abxy]?\$\d+\$/.test(password)) {
      newPassword = await bcrypt.hash(password, salt);
    }

    const result = await this.usersRepository.update(
      {
        email,
      },
      {
        password: newPassword,
      },
    );
    return result;
  }
}
