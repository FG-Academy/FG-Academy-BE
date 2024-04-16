import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Course,
      Lecture,
      Enrollment,
      LectureTimeRecord,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
