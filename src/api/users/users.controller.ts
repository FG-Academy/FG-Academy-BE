import {
  Controller,
  HttpCode,
  Get,
  Body,
  Post,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateLectureRecordDto } from './dto/update-lectureRecord.dto';
import { Public } from '../auth/decorators/public.decorator';
import { LocalAuthGuard } from '../auth/guards/localAuth.guard';

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

  @Public()
  @Post('/save-lecture-record')
  async saveMinutes(@Body() dto: UpdateLectureRecordDto) {
    await this.usersService.saveMinutes(dto.minutes, dto.userId, dto.lectureId);
    return { message: 'Successfully saved playtime' };
  }
}
