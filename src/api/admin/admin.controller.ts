import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FormDataRequest } from 'nestjs-form-data';

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
}
