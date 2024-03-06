import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course-dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto) {
    const newCourseData = this.courseRepository.create(createCourseDto);
    console.log(newCourseData);

    await this.courseRepository.save(newCourseData);

    return { message: 'Success' };
  }

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find();
  }
}
