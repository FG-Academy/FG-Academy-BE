import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
  async findAllLecturesByCourseId(@Param('courseId') courseId: number) {
    const data = await this.coursesService.getAllLecturesByCourseId(courseId);
    return data;
  }

  // @Public()
  @Get(':courseId/lectures/progress')
  getLecturesProgress(
    @Param('courseId') courseId: number,
    // @Query('userId') userId: number,
    @AuthUser() user,
  ) {
    console.log('user', user);
    const userId = 1;
    return this.coursesService.getLecturesProgress(courseId, userId);
  }
}
