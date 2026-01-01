import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateLecturesDto } from './dto/update-lectures.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Roles } from '../users/decorators/role.decorator';
import { FeedbackDescriptiveQuiz } from './dto/feedbackDescriptiveQuiz.dto';
import { CreateQuizDto } from './dto/create-new-quiz.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';
import { AuthUser } from '../users/decorators/user.decorator';
import { FeedbackDto } from './dto/feedback.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { CopyCourseDto } from './dto/copy-course.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('admin')
@Roles('admin', 'manager', 'tutor')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 유저 정보
   */
  // @ApiOperation({ summary: '[관리자 화면-유저] 전체 유저 가져오기' })
  // @Get('/users')
  // findAllUsers() {
  //   return this.adminService.findAllUsers();
  // }

  @ApiOperation({ summary: '[관리자 화면-유저] 전체 유저 가져오기' })
  @Get('/users')
  findAllUsers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('size', ParseIntPipe) size: number = 10,
    @Query('sortBy') sortBy: 'name' | 'createdAt' | 'yearOfService' = 'name',
    @Query('level') level?: string,
    @Query('church') church?: string,
    @Query('position') position?: string,
    @Query('department') department?: string,
    @Query('name') name?: string,
  ) {
    return this.adminService.findAllUsers({
      page,
      size,
      sortBy,
      level,
      church,
      position,
      department,
      name,
    });
  }

  @ApiOperation({ summary: '[관리자 화면-유저] 한 유저 정보 가져오기' })
  @Get('/users/:userId')
  findUserById(@Param('userId') userId: number) {
    return this.adminService.findUserById(userId);
  }

  @ApiOperation({ summary: '[관리자 화면-유저] 한 유저 정보 가져오기' })
  @Get('/users/:userId/enrollments')
  findUserEnrollmentsById(@Param('userId') userId: number) {
    return this.adminService.findUserEnrollmentsById(userId);
  }

  @ApiOperation({ summary: '[관리자 화면-유저] 한 유저 정보 가져오기' })
  @Get('/users/:userId/enrollments/:courseId')
  findUserLectureDetail(
    @Param('userId') userId: number,
    @Param('courseId') courseId: number,
  ) {
    return this.adminService.findUserLectureDetail(userId, courseId);
  }

  @Patch('/users/:userId')
  async updateOneByUserId(
    @Body() dto: UpdateUserDto,
    @Param('userId') userId: number,
  ) {
    return await this.adminService.updateDB(dto, userId);
  }

  @Delete('/users/:userId')
  async deleteUserById(@Param('userId') userId: number) {
    await this.adminService.deleteUser(userId);
    return { message: '유저를 성공적으로 삭제하였습니다' };
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
  createCourse(@Body() createCourseDto: CreateCourseDto) {
    return this.adminService.createCourse(createCourseDto);
  }

  @Delete('/courses')
  async deleteCourses(@Body() deleteCourseDto: DeleteCourseDto) {
    await this.adminService.deleteCourses(deleteCourseDto);

    return { message: 'Courses deleted successfully' };
  }

  @Post('/courses/copy')
  async copyCourses(@Body() copyCourseDto: CopyCourseDto) {
    const newCourses = await this.adminService.copyCourses(copyCourseDto);

    return { message: 'Courses copied successfully', courses: newCourses };
  }

  @ApiOperation({ summary: '[관리자 화면-강의] 한 강의 정보 가져오기' })
  @Get('/courses/:courseId')
  findOne(@Param('courseId') courseId: number) {
    return this.adminService.findOne(courseId);
  }

  @Patch('/courses/:courseId')
  async create(
    @Param('courseId') courseId: number,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    await this.adminService.updateCourse(courseId, updateCourseDto);
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
   * 카테고리 정보
   */
  // 카테고리를 order 순서대로 가져오는 API
  @Get('/categories')
  findAllCategories() {
    return this.adminService.findAllCategories();
  }

  // 카테고리 수정 API
  @Put('/categories')
  updateCategory(@Body() updateCategoryDto: UpdateCategoryDto) {
    return this.adminService.updateCategories(updateCategoryDto);
  }

  /**
   * 퀴즈 정보
   */
  @Roles('admin', 'tutor', 'manager')
  @ApiOperation({ summary: '[관리자 화면-퀴즈] 모든 제출된 퀴즈 가져오기' })
  @Get('quizzes')
  async findQuizData(
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
    @Query('orderBy') orderBy: 'newest' | 'oldest' = 'newest',
    @Query('userDepartment') userDepartment: string,
    @Query('userLevel') userLevel: 'admin' | 'tutor' = 'admin',
    @Query('name') name?: string,
    @Query('position') position?: string,
    @Query('department') departmentName?: string,
    @Query('courseTitle') courseTitle?: string,
    @Query('quizType') quizType?: '객관식' | '주관식',
    @Query('answerStatus') answerStatus?: string,
  ) {
    return await this.adminService.findQuizAll({
      page,
      size,
      orderBy,
      name,
      position,
      departmentName,
      courseTitle,
      quizType,
      answerStatus,
      userDepartment,
      userLevel,
    });
  }

  @Roles('admin', 'tutor', 'manager')
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

  @Roles('admin', 'tutor', 'manager')
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

  @Roles('admin', 'tutor', 'manager')
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

  @Roles('admin', 'tutor', 'manager')
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
