import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AuthUser } from '../users/decorators/user.decorator';
import { FeedbackDto } from './dto/feedback.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('admin')
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 유저 정보
   */
  @ApiOperation({ summary: '[관리자 화면-유저] 전체 유저 가져오기' })
  @Get('/users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @ApiOperation({ summary: '[관리자 화면-유저] 한 유저 정보 가져오기' })
  @Get('/users/:userId')
  findUserById(@Param('userId') userId: number) {
    return this.adminService.findUserById(userId);
  }

  @Patch('/users/:userId')
  async updateOneByUserId(
    @Body() dto: UpdateUserDto,
    @Param('userId') userId: number,
  ) {
    return await this.adminService.updateDB(dto, userId);
  }

  /**
   * 강의 정보
   */
  @ApiOperation({ summary: '[관리자 화면-강의] 전체 강의 가져오기' })
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

  @ApiOperation({ summary: '[관리자 화면-강의] 한 강의 정보 가져오기' })
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

  @ApiOperation({
    summary: '[관리자 화면-퀴즈] 유저 별 코스 정보 가져오기',
  })
  @Get('lectures/:userId')
  getAllLectures(@Param('userId') userId: number) {
    return this.adminService.getAllLectures(userId);
  }

  @Get('/curriculum')
  async findAllCurriculums() {
    const result = await this.adminService.findAllCurriculums();
    return { data: result };
  }

  /**
   * 퀴즈 정보
   */
  @Roles('admin', 'tutor')
  @ApiOperation({ summary: '[관리자 화면-퀴즈] 모든 제출된 퀴즈 가져오기' })
  @Get('quizzes')
  async findQuizData() {
    return await this.adminService.findQuizAll();
  }

  @Roles('admin', 'tutor')
  @Post('quizzes/feedback/:userId/:quizId')
  async feedbackDescriptiveQuiz(
    @Param('userId') userId: number,
    @Param('quizId') quizId: number,
    @Body() feedbackDescriptiveQuizDto: FeedbackDescriptiveQuiz,
  ) {
    return await this.adminService.feedbackQuiz(
      userId,
      quizId,
      feedbackDescriptiveQuizDto,
    );
  }

  @Roles('admin', 'tutor')
  @ApiOperation({
    summary: '[관리자 화면-퀴즈] 유저가 제출한 주관식 퀴즈 가져오기',
  })
  @Get('quizzes/descriptive/:userId/:quizId')
  getDescriptiveQuiz(
    @Param('userId') userId: number,
    @Param('quizId') quizId: number,
  ) {
    return this.adminService.getDescriptiveQuiz(userId, quizId);
  }

  @Roles('admin', 'tutor')
  @ApiOperation({
    summary: '[관리자 화면-퀴즈] 주관식 퀴즈 채점 화면',
  })
  @Get('/quizzes/:userId')
  getSubmittedQuizByUserId(@Param('userId') userId: number) {
    return this.adminService.getSubmittedQuizByUserId(userId);
  }

  @Post('/quizzes/register/:lectureId')
  createNewQuiz(
    @Param('lectureId') lectureId: number,
    @Body() createQuizDto: CreateQuizDto,
  ) {
    return this.adminService.createNewQuiz(lectureId, createQuizDto);
  }

  @Patch('/quizzes/edit/:quizId')
  patchQuizData(
    @Param('quizId') quizId: number,
    @Body() updateQuizDto: CreateQuizDto,
  ) {
    return this.adminService.updateQuizData(quizId, updateQuizDto);
  }

  @Delete('/quizzes/delete/:quizId')
  deleteQiuz(@Param('quizId') quizId: number) {
    return this.adminService.deleteQuiz(quizId);
  }

  @Roles('admin', 'tutor')
  @Patch('quizzes/:quizId/feedback')
  async updateQuizAnswer(
    @Param('quizId') quizId: number,
    @AuthUser('userId') userId: number,
    @Body() dto: FeedbackDto,
  ) {
    await this.adminService.feedbackToUserAnswer(quizId, userId, dto);
    return { message: 'Feedback updated successfully' };
  }
}
