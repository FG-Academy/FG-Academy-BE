import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { IsUserAlreadyExist } from './validator/isUserAlreadyExist.validator';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { Enrollment } from 'src/entities/enrollment.entity';
import { Course } from 'src/entities/course.entity';
import { Lecture } from 'src/entities/lecture.entity';
// import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LectureTimeRecord,
      Enrollment,
      Course,
      Lecture,
    ]),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
          },
        },
        defaults: {
          from: `"꽃동산아카데미" ${process.env.EMAIL_ADDRESS}`,
        },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, IsUserAlreadyExist],
  exports: [UsersService],
})
export class UsersModule {}
