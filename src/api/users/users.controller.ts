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
import { AuthUser } from './decorators/user.decorator';
import { Roles } from './decorators/role.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Roles('admin')
  @Get()
  async findPage(@Query() query) {
    if (query.page) {
      return await this.usersService.findPage(query.page);
    } else if (query.name) {
      return await this.usersService.findByName(query.name);
    }
    return await this.usersService.findAll();
  }

  @Public()
  @Get('/userByFile')
  async createUsersByFile() {
    await this.usersService.createUsersByFile();
  }

  @HttpCode(200)
  @Get('/profile')
  async getProfile(@AuthUser() user) {
    // 주요 정보 제외하고 resultData에 회원정보를 담아서 전송
    const { password, refreshToken, ...resultData } = user;

    return resultData;
  }

  @Post('/profile')
  async updateUserInfo(
    @Body() dto: UpdateUserDto,
    @AuthUser('userId') userId: number,
  ) {
    const result = await this.usersService.updateDB(dto, userId);
    return result;
  }

  @Patch(':userId')
  async updateOneByUserId(
    @Body() dto: UpdateUserDto,
    @Param('userId') userId: number,
  ) {
    return await this.usersService.updateDB(dto, userId);
  }

  @Delete('/profile')
  async deleteUserInfo(@Req() req) {
    const result = await this.usersService.deleteUserInfo(req.user.userId);

    return result;
  }

  @Public()
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

  // 사용자가 강의를 수강할 때 시간을 저장하는 API
  @Post('/save-lecture-record')
  async saveMinutes(@Body() dto: UpdateLectureRecordDto, @AuthUser() user) {
    const userId = user.userId;
    await this.usersService.saveMinutes(dto.minutes, userId, dto.lectureId);
    return { message: 'Successfully saved playtime' };
  }
  // 사용자가 한 강의의 수강이 끝나면 해당 API가 작동해서 수강 완료 여부를 입력함
  // 강의 수강 완료 시에, 해당 API가 작동해서 강의 완료 여부를 판독할 수 있도록 해야함
  @Patch('/completed')
  async updateCompleted(
    @Body('lectureId') lectureId: number,
    @AuthUser() user,
  ) {
    const userId = user.userId;

    await this.usersService.updateCompleted(userId, lectureId);
    return { message: 'Successfully updated completed status' };
  }
}
