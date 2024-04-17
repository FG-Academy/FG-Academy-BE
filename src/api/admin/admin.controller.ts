import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FormDataRequest } from 'nestjs-form-data';
import { UpdateLecturesDto } from './dto/update-lectures.dto';

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
  @FormDataRequest()
  async create(
    @Param('courseId') courseId: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    console.log(updateCourseDto);
    await this.adminService.updateCourse(courseId, updateCourseDto);
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
}
