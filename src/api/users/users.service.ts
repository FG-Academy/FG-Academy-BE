/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOneOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/entities/user.entity';
import { SignUpDto } from '../auth/dto/signUp.dto';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { UpdateUserDto } from '../admin/dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { v4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
import { instanceToPlain } from 'class-transformer';
import * as ExcelJS from 'exceljs';
import { Enrollment } from 'src/entities/enrollment.entity';
import { Course } from 'src/entities/course.entity';
import {
  Department,
  departments,
  Position,
  positions,
} from '../admin/type/type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
    @InjectRepository(LectureTimeRecord)
    private lectureTimeRecordRepository: Repository<LectureTimeRecord>, // UserRepository 주입
    private readonly mailerService: MailerService,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private entityManager: EntityManager,
  ) {}

  async findAll() {
    const users = await this.usersRepository.find();

    const usersForResponse = users.map((user) => instanceToPlain(user));
    return usersForResponse;
  }

  async findByName(name: string) {
    const [users, count] = await this.usersRepository.findAndCount({
      where: {
        name,
      },
    });
    if (!users) {
      throw new NotFoundException('User not found');
    }

    return {
      users: instanceToPlain(users),
      count,
    };
  }

  async findPage(page: number) {
    const take = 10; // 한 페이지 당 아이템 수
    const skip = (page - 1) * take; // 건너뛸 아이템 수 계산

    const [users, count] = await this.usersRepository.findAndCount({
      take: take,
      skip: skip,
    });

    return {
      users: instanceToPlain(users),
      count,
    };
  }

  async create(data: SignUpDto): Promise<User> {
    const user = this.usersRepository.create(data);

    return this.usersRepository.save(user);
  }

  async findByNameBirthId(nameBirthId: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail({
      where: {
        nameBirthId,
        status: 'active',
      },
    });

    return user;
  }

  async findOne(where: FindOneOptions<User>) {
    const user = await this.usersRepository.findOne(where);

    if (!user) {
      throw new NotFoundException(
        `There isn't any user with identifier: ${where}`,
      );
    }

    return user;
  }

  async saveMinutes(minutes: number, userId: number, lectureId: number) {
    const newRecord = this.lectureTimeRecordRepository.create({
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
    // 예외처리를 잘 해야할 듯 하다.
    console.log(userId, lectureId);
    const isExist = await this.lectureTimeRecordRepository.findOne({
      where: { user: { userId }, lecture: { lectureId } },
    });

    if (!isExist) {
      throw new HttpException(
        '수강한 적이 없는 강의입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

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
    const user = await this.usersRepository.findOne({
      where: {
        userId,
      },
    });
    if (data.email) {
      const isEmailExist = await this.usersRepository.findOne({
        where: {
          email: data.email,
        },
      });
      if (isEmailExist && user.email !== data.email) {
        throw new HttpException(
          '이메일이 유효하지 않습니다.',
          HttpStatus.CONFLICT,
        );
        // throw new UnprocessableEntityException('이미 존재하는 이메일입니다.');
      }
    }

    try {
      const toSaveUser = this.usersRepository.create({
        ...user,
        ...data,
      });
      await this.usersRepository.update({ userId }, toSaveUser);
    } catch (err) {
      throw new Error(err);
    }

    return { message: 'Successfully update user info.' };
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
      subject: '꽃동산 아카데미 이메일 인증코드',
      text: `꽃동산 아카데미 이메일 인증코드는

      ${verficationCode} 
      
      입니다.`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">꽃동산 아카데미 이메일 인증코드</h2>
        <p style="font-size: 16px; color: #555;">안녕하세요,</p>
        <p style="font-size: 16px; color: #555;">꽃동산 아카데미 이메일 인증코드는 다음과 같습니다:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; padding: 10px 20px; font-size: 18px; color: #fff; background-color: #007bff; border-radius: 5px;">${verficationCode}</span>
        </div>
        <p style="font-size: 16px; color: #555;">감사합니다.</p>
      </div>
    `,
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

  async createUsersByFile(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(
      `${__dirname}/../../../src/api/users/0605.xlsx`,
    );
    const worksheet = workbook.getWorksheet('Sheet1');

    try {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          for (const row of worksheet.getRows(2, worksheet.rowCount - 1)) {
            // console.log(row);
            // const department = row.getCell(1).value.toString();
            const name = row.getCell(2).value.toString();
            const positionLabel = row.getCell(3).value.toString();
            const phoneNumber = row.getCell(4).value || '';
            const birthDate = row.getCell(5).value.toString();
            const birth = row.getCell(6).value.toString();
            const birthDateFormatted = `${birth.slice(0, 4)}-${birth.slice(4, 6)}-${birth.slice(6, 8)}`;
            const yearsOfService = (row.getCell(7).value as number) || 0;
            const id = row.getCell(8).value.toString();
            const email = row.getCell(9).value.toString();
            const essenceCompleted = row.getCell(10).value as number;
            const doctrineCompleted = row.getCell(11).value as number;
            const departmentNameLabel = row.getCell(12).value.toString();

            const departmentName =
              departments.find((dept) => dept.label === departmentNameLabel)
                ?.value || Department.ETC;
            const position =
              positions.find((pos) => pos.label === positionLabel)?.value ||
              Position.ETC;

            const password = birthDate; // 예시로 ID를 비밀번호로 사용
            const newUser = transactionalEntityManager.create(User, {
              nameBirthId: id,
              name,
              position,
              phoneNumber: phoneNumber as string,
              birthDate: new Date(birthDateFormatted),
              yearsOfService,
              password,
              email,
              departmentName,
            });
            await transactionalEntityManager.save(newUser);

            const oneCourse = await this.courseRepository.findOneOrFail({
              where: { courseId: 8 },
            });
            const twoCourse = await this.courseRepository.findOneOrFail({
              where: { courseId: 5 },
            });

            await transactionalEntityManager.save(Enrollment, {
              user: newUser,
              course: oneCourse,
              completedNumber: essenceCompleted,
            });
            await transactionalEntityManager.save(Enrollment, {
              user: newUser,
              course: twoCourse,
              completedNumber: doctrineCompleted,
            });
          }
        },
      );
    } catch (err) {
      console.error('Error during transaction:', err);
      throw err; // 에러를 다시 던져서 호출자에게 알립니다.
    }
    console.log('완료');
  }

  private async calculateCompleted(total: number, percentage: number | string) {
    // console.log(total, percentage);
    if (percentage === '완료') {
      return total;
    }
    if (typeof percentage === 'number') {
      return Math.floor(total * (percentage / 100));
    }
  }
  private extractUserInfo(idStr: string): [string, string] {
    const nameMatch = /^[^\d]+/.exec(idStr);
    const birthMatch = /(\d{4})$/.exec(idStr);
    const userName = nameMatch ? nameMatch[0] : null;
    const birthDate = birthMatch
      ? `1970-${birthMatch[1].substring(0, 2)}-${birthMatch[1].substring(2, 4)}`
      : '01-01';
    return [userName, birthDate];
  }
}
