/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Controller,
  HttpCode,
  Get,
  Body,
  Post,
  Request,
  Delete,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateLectureRecordDto } from './dto/update-lectureRecord.dto';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { EmailDto } from './dto/email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

// @Public()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(200)
  @Get('/profile')
  getProfile(@Request() req) {
    // 주요 정보 제외하고 resultData에 회원정보를 담아서 전송
    const { password, refreshToken, createdAt, updatedAt, ...resultData } =
      req.user;

    return resultData;
  }

  @Post('/profile')
  async updateUserInfo(@Body() dto: UpdateUserDto, @Request() req) {
    console.log(dto);
    console.log(req.user.userId);
    const result = await this.usersService.updateDB(dto, req.user.userId);
    return result;
  }

  @Delete('/profile')
  async deleteUserInfo(@Request() req) {
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
