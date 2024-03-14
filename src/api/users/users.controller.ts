import { Controller, HttpCode, Get, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateLectureRecordDto } from './dto/update-lectureRecord.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @HttpCode(200)
  @Get()
  findAll() {
    return { message: 'Success' };
  }

  @Public()
  @Post('/save-lecture-record')
  async saveMinutes(@Body() dto: UpdateLectureRecordDto) {
    await this.usersService.saveMinutes(dto.minutes, dto.userId, dto.lectureId);
    return { message: 'Successfully saved playtime' };
  }
}
