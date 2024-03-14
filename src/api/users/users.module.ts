import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { IsUserAlreadyExist } from './validator/isUserAlreadyExist.validator';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, LectureTimeRecord])],
  controllers: [UsersController],
  providers: [UsersService, IsUserAlreadyExist],
  exports: [UsersService],
})
export class UsersModule {}
