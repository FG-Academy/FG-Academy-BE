import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  // Request,
  // Query,
  //   UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { AuthUser } from '../users/decorators/user.decorators';
import { Public } from '../auth/decorators/public.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  //@Req() request: Request)  =>
  // 나중에 해당 API를 보낸 사람이 관리자인지 아닌지 확인하는 Validation 필요하지 않을까

  @Post()
  @FormDataRequest({ storage: FileSystemStoredFile, autoDeleteFile: false })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':courseId')
  findOne(@Param('courseId') courseId: number) {
    return this.coursesService.findOne(courseId);
  }

  @Post(':courseId/lectures')
  async createLecturesByCourseId(
    @Param('courseId') courseId: number,
    @Body() createLectureDtos: CreateLectureDto[],
  ) {
    await this.coursesService.createLecturesByCourseId(
      courseId,
      createLectureDtos,
    );
    return { message: 'Lectures created successfully' };
  }

  @Get(':courseId/lectures')
  async findAllLecturesByCourseId(
    @Param('courseId') courseId: number,
    @AuthUser() user,
  ) {
    const userId = user.userId;
    const data = await this.coursesService.getAllLecturesByCourseId(
      courseId,
      userId,
    );
    return data;
  }

  // @Public()
  @Get(':courseId/lectures/progress')
  getLecturesProgress(
    @Param('courseId') courseId: number,
    // @Query('userId') userId: number,
    @AuthUser() user,
  ) {
    const userId = user.userId;
    return this.coursesService.getLecturesProgress(courseId, userId);
  }

  @Post(':courseId/enrollment')
  enrollCourse(@Param('courseId') courseId: number, @AuthUser() user) {
    const userId = user.userId;
    console.log(user);
    // 유저의 레벨에 따라서 수강 신청을 막거나 허용하는 Validation이 필요함
    return this.coursesService.enrollCourse(courseId, userId);
  }

  //! 사용자가 특정 코스에 참여했는지 여부를 알기 위해 동작하는 API
  @Get(':courseId/enrollment')
  getEnrollmentData(@Param('courseId') courseId: number, @AuthUser() user) {
    const userId = user.userId;

    return this.coursesService.getEnrollmentData(courseId, userId);
  }

  //TODO: 내 강의실에는 수강 신청한 모든 코스에 대한 수강 완료 강의와 그 전체 길이를 가져와야하는데, 그러면 쿼리가 너무 복잡해지지 않을까?
  // 그냥 수강 완료하면 enrollment 테이블의 개수 하나를 +1 시켜주는 방식으로 하고 그 값을 가져오는건 어떠나? 너무 안정적이지 못한가?
}
