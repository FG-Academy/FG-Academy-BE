import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from 'src/entities/course.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async createQuizzes(createQuizDtos: CreateQuizDto[]) {
    console.log(createQuizDtos);
  }

  async findAllByCourseId(courseId: number) {
    const course = await this.courseRepository.findOne({
      // select: { courseId: true },
      relations: ['lectures', 'lectures.quizzes'],
      where: { courseId },
    });

    console.log(course);

    return course.lectures;
  }
}
