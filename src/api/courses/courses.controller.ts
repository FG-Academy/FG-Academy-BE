import { Body, Controller, Post, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course-dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  //@Req() request: Request)  =>
  // 나중에 해당 API를 보낸 사람이 관리자인지 아닌지 확인하는 Validation 필요하지 않을까

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createCourse(createCourseDto);
  }
}
