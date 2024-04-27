import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from 'src/entities/course.entity';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { CreateQuizAnswerDto } from './dto/create-quizAnswr.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizSubmit)
    private readonly quizSubmitRepository: Repository<QuizSubmit>,
  ) {}

  async createQuizzes(createQuizDtos: CreateQuizDto[]) {
    console.log(createQuizDtos);
  }

  async findAllByCourseId(courseId: number, userId: number) {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.lectures', 'lecture')
      .leftJoinAndSelect('lecture.quizzes', 'quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect('lecture.lectureTimeRecords', 'lectureTimeRecord')
      // 필요하다면 사용자에 특정한 시청 기록만 필터링
      .andWhere('lectureTimeRecord.userId = :userId', { userId })
      .where('course.courseId = :courseId', { courseId })
      .orderBy('lecture.lectureNumber', 'ASC')
      .addOrderBy('quiz.quizId', 'ASC')
      .addOrderBy('quizAnswer.id', 'ASC')
      // 강의 시청 기록에 대한 정렬이 필요하다면 여기에 추가
      .getOne();

    // await this.courseRepository.findOne({
    //   select: { lectures: true },
    //   relations: [
    //     'lectures',
    //     'lectures.quizzes',
    //     'lectures.lectureTimeRecords',
    //     'lectures.quizzes.quizAnswers',
    //   ],
    //   where: { courseId },
    // });

    // console.log(course, userId);
    // console.log(course.lectures[0].quizzes);

    return course;
  }

  async findAllLectureQuiz(
    courseId: number,
    lectureId: number,
    userId: number,
  ): Promise<Quiz[]> {
    // return await this.quizRepository.find({
    //   where: { lecture: { lectureId } },
    //   relations: ['quizAnswers', 'quizSubmits'],
    // });
    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect(
        'quiz.quizSubmits',
        'quizSubmit',
        'quizSubmit.userId = :userId',
        { userId },
      )
      .where('quiz.lectureId = :lectureId', { lectureId })
      .orderBy('quiz.quizId', 'ASC')
      .addOrderBy('quizAnswer.id', 'ASC')
      .getMany();

    return quizzes;
  }

  async saveUserAnswer(
    courseId: number,
    lectureId: number,
    userId: number,
    data: CreateQuizAnswerDto,
  ) {
    const isSubmitted = await this.quizSubmitRepository.findOne({
      where: {
        user: { userId: userId }, // userId를 사용하여 user 엔티티와 매칭
        quiz: { quizId: data.quizId }, // quizId를 사용하여 quiz 엔티티와 매칭
      },
    });
    if (isSubmitted !== null) {
      throw new HttpException(
        '이미 답안을 제출한 퀴즈입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      if (data.submittedAnswer === null) {
        await Promise.all(
          data.multipleAnswer.map(async (ele) => {
            const quizAnswerData = this.quizSubmitRepository.create({
              user: { userId: userId },
              quiz: { quizId: data.quizId },
              multipleAnswer: ele,
            });

            await this.quizSubmitRepository.save(quizAnswerData);
          }),
        );
      } else {
        const DescriptiveAnswerData = this.quizSubmitRepository.create({
          user: { userId },
          quiz: { quizId: data.quizId },
          multipleAnswer: 0,
          submittedAnswer: data.submittedAnswer,
        });

        await this.quizSubmitRepository.save(DescriptiveAnswerData);
      }
      return { message: '퀴즈가 성공적으로 제출되었습니다.' };
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
