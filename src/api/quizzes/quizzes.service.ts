import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from 'src/entities/course.entity';
import { Quiz } from 'src/entities/quiz.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  async createQuizzes(createQuizDtos: CreateQuizDto[]) {
    console.log(createQuizDtos);
  }

  async findAllByCourseId(courseId: number, userId: number) {
    const course = await this.courseRepository.findOne({
      select: { lectures: true },
      relations: [
        'lectures',
        'lectures.quizzes',
        'lectures.lectureTimeRecords',
        'lectures.quizzes.quizSubmits',
      ],
      where: { courseId },
    });

    console.log(course, userId);
    console.log(course.lectures[0].quizzes);
  }
}
