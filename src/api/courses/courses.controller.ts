import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  //   UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course-dto';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';
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

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }
}
