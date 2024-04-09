/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Controller,
  HttpCode,
  Get,
  Body,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateLectureRecordDto } from './dto/update-lectureRecord.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { EmailDto } from './dto/email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Request } from 'express';
import { AuthUser } from './decorators/user.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findPage(@Query() query) {
    if (query.page) {
      return await this.usersService.findPage(query.page);
    } else if (query.name) {
      return await this.usersService.findByName(query.name);
    }
    return await this.usersService.findAll();
  }

  @HttpCode(200)
  @Get('/profile')
  async getProfile(@AuthUser() user) {
    // console.log(user);
    // 주요 정보 제외하고 resultData에 회원정보를 담아서 전송
    const { password, refreshToken, ...resultData } = user;

    return resultData;
  }

  @Get(':userId')
  async findOneByUserId(@Param('userId') userId: number) {
    return await this.usersService.findOneByUserId({ where: { userId } });
  }

  @Patch(':userId')
  async updateOneByUserId(
    @Body() dto: UpdateUserDto,
    @Param('userId') userId: number,
  ) {
    return await this.usersService.updateDB(dto, userId);
  }

  @Post('/profile')
  async updateUserInfo(@Body() dto: UpdateUserDto, @Req() req) {
    console.log(dto);
    console.log(req.user.userId);
    const result = await this.usersService.updateDB(dto, req.user.userId);
    return result;
  }

  @Delete('/profile')
  async deleteUserInfo(@Req() req) {
    const result = await this.usersService.deleteUserInfo(req.user.userId);

    return result;
  }

  @Post('email')
  async findEmailExist(@Body() emailDto: EmailDto) {
    const result = await this.usersService.findEmailExist(emailDto.email);
    if (!result) return false;
    return true;
  }

  @Public()
  @Get('email')
  async sendEmail(@Query('email') email: string) {
    const result = await this.usersService.sendEmail(email);
    return { code: result };
  }

  @Public()
  @Patch('password')
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    const result = await this.usersService.updatePassword(updatePasswordDto);
    return { message: '비밀번호를 성공적으로 변경했습니다.' };
  }

  @Public()
  @Post('/save-lecture-record')
  async saveMinutes(@Body() dto: UpdateLectureRecordDto) {
    await this.usersService.saveMinutes(dto.minutes, dto.userId, dto.lectureId);
    return { message: 'Successfully saved playtime' };
  }

  @Patch(':userId/completed')
  async updateCompleted(
    @Param('userId') userId: number,
    @Body('lectureId') lectureId: number,
  ) {
    await this.usersService.updateCompleted(userId, lectureId);
    return { message: 'Successfully updated completed status' };
  }
}
