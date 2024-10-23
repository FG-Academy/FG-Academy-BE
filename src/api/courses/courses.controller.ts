import { AuthUser } from './../users/decorators/user.decorator';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({ summary: '[홈 화면, 강의 목록 화면] 모든 코스를 가져옴' })
  @Public()
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @ApiOperation({ summary: '[코스 상세 화면] 코스 ID로 코스 정보 조회' })
  @Get(':courseId')
  findOne(@Param('courseId') courseId: number) {
    return this.coursesService.findOne(courseId);
  }

  @ApiOperation({ summary: '[코스 상세 화면] 코스 ID로 lectures 조회' })
  @Get(':courseId/lectures')
  async findAllLecturesByCourseId2(@Param('courseId') courseId: number) {
    const data = await this.coursesService.getAllLecturesByCourseId(courseId);
    return data;
  }

  @ApiOperation({ summary: 'progress 정보 가져오기' })
  @Get(':courseId/lectures/progress')
  getLecturesProgress(
    @Param('courseId') courseId: number,
    @AuthUser('userId') userId: number,
  ) {
    return this.coursesService.getLecturesProgress2(courseId, userId);
  }

  @Post(':courseId/enrollment')
  enrollCourse(@Param('courseId') courseId: number, @AuthUser() user) {
    const { userId, level } = user;

    return this.coursesService.enrollCourse(courseId, userId, level);
  }

  @ApiOperation({ summary: '[강의 상세 화면] 수강 신청 정보 가져오기' })
  @Get(':courseId/enrollment')
  getEnrollmentData(
    @Param('courseId') courseId: number,
    @AuthUser('userId') userId: number,
  ) {
    return this.coursesService.getEnrollmentData(courseId, userId);
  }

  @Get('myLectures/:courseId')
  getLectures(
    @AuthUser('userId') userId: number,
    @Param('courseId') courseId: number,
  ) {
    return this.coursesService.findAllLecturesByCourseId(userId, courseId);
  }

  @ApiOperation({ summary: '[강의 수강 화면] lectureTimeRecord 가져오기' })
  @Get('lectures/:lectureId')
  getLectureRecords(
    @Param('lectureId') lectureId: number,
    @AuthUser('userId') userId: number,
  ) {
    return this.coursesService.getLectureRecords(lectureId, userId);
  }
}
