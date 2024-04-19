import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateLecturesDto } from './dto/update-lectures.dto';
import { FileUploadInterceptor } from './interceptor/fileUploadInterceptor';
import { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('/users/:userId')
  findUserById(@Param('userId') userId: number) {
    return this.adminService.findUserById(userId);
  }

  // @Public()
  @Get('/courses')
  findAll() {
    return this.adminService.findAll();
  }

  @Get('/courses/:courseId')
  findOne(@Param('courseId') courseId: number) {
    return this.adminService.findOne(courseId);
  }

  @Patch('/courses/:courseId')
  // @FormDataRequest()
  // @UseInterceptors(FileInterceptor('thumbnailImage'))
  @UseInterceptors(FileUploadInterceptor)
  async create(
    @Param('courseId') courseId: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: Request,
  ) {
    console.log(updateCourseDto);
    const filepath = req['filepath']; // 파일 경로 접근
    console.log(filepath);
    await this.adminService.updateCourse(courseId, updateCourseDto, filepath);
    return { message: 'Course updated successfully' };
  }

  @Post('/courses/:courseId/lectures')
  async updateLectures(
    @Param('courseId') courseId: number,
    @Body() updateLecturesDto: UpdateLecturesDto,
  ) {
    console.log(updateLecturesDto);
    await this.adminService.updateLectures(courseId, updateLecturesDto);
    return { message: 'Course updated successfully' };
  }

  @Get('/curriculum')
  async findAllCurriculums() {
    const result = await this.adminService.findAllCurriculums();
    return { data: result };
  }
}
