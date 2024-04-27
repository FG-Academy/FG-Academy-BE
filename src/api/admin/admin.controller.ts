import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateLecturesDto } from './dto/update-lectures.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FileUploadInterceptor } from './interceptor/fileUploadInterceptor';
import { Roles } from '../users/decorators/role.decorator';
import { Request } from 'express';
import { FeedbackDescriptiveQuiz } from './dto/feedbackDescriptiveQuiz.dto';
import { CreateQuizDto } from './dto/create-new-quiz.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';

@Roles('admin')
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

  @Post('/courses')
  @UseInterceptors(FileUploadInterceptor)
  createCourse(@Body() createCourseDto: CreateCourseDto, @Req() req: Request) {
    const filepath = req['filepath']; // 파일 경로 접근
    return this.adminService.createCourse(createCourseDto, filepath);
  }

  @Delete('/courses')
  async deleteCourses(@Body() deleteCourseDto: DeleteCourseDto) {
    await this.adminService.deleteCourses(deleteCourseDto);

    return { message: 'Courses deleted successfully' };
  }

  @Get('/courses/:courseId')
  findOne(@Param('courseId') courseId: number) {
    return this.adminService.findOne(courseId);
  }

  @Patch('/courses/:courseId')
  @UseInterceptors(FileUploadInterceptor)
  async create(
    @Param('courseId') courseId: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: Request,
  ) {
    const filepath = req['filepath']; // 파일 경로 접근
    await this.adminService.updateCourse(courseId, updateCourseDto, filepath);
    return { message: 'Course updated successfully' };
  }

  @Post('/courses/:courseId/lectures')
  async updateLectures(
    @Param('courseId') courseId: number,
    @Body() updateLecturesDto: UpdateLecturesDto,
  ) {
    await this.adminService.updateLectures(courseId, updateLecturesDto);
    return { message: 'Course updated successfully' };
  }

  @Get('/curriculum')
  async findAllCurriculums() {
    const result = await this.adminService.findAllCurriculums();
    return { data: result };
  }
  // 가드를 고려하여 Param이 없는 라우트 먼저 선언해야함

  @Get('quizzes')
  async findQuizData() {
    return await this.adminService.findQuizAll();
  }

  @Post('quizzes/feedback/:userId/:quizId')
  async feedbackDescriptiveQuiz(
    @Param('userId') userId: number,
    @Param('quizId') quizId: number,
    @Body() feedbackDescriptiveQuizDto: FeedbackDescriptiveQuiz,
  ) {
    console.log(feedbackDescriptiveQuizDto);
    return await this.adminService.feedbackQuiz(
      userId,
      quizId,
      feedbackDescriptiveQuizDto,
    );
  }

  @Get(':userId')
  async findOneByUserId(@Param('userId') userId: number) {
    return await this.adminService.findOneByUserId({ where: { userId } });
  }

  @Roles('admin')
  @Get('/quizzes/:userId')
  getMyQuizList(@Param('userId') userId: number, @Query('type') type: string) {
    const queryQuizType = type;
    return this.adminService.findMultipleQuizList(userId, queryQuizType);
  }

  @Post('/quizzes/register/:lectureId')
  createNewQuiz(
    @Param('lectureId') lectureId: number,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    return this.adminService.createNewQuiz(lectureId, createQuizDto);
  }
}
