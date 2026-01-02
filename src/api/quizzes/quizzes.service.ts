import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { CreateQuizAnswerDto } from './dto/create-quizAnswer.dto';
import { QuizAnswer } from 'src/entities/quizAnswer.entity';
import { Course } from 'src/entities/course.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { groupBy } from 'es-toolkit';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizSubmit)
    private readonly quizSubmitRepository: Repository<QuizSubmit>,
    @InjectRepository(QuizAnswer)
    private readonly quizAnswerRepository: Repository<QuizAnswer>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllLectureQuiz(lectureId: number, userId: number): Promise<Quiz[]> {
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
      .addOrderBy('quizAnswer.itemIndex', 'ASC')
      .getMany();

    return quizzes;
  }

  async findQuizById(quizId: number, userId: number) {
    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect(
        'quiz.quizSubmits',
        'quizSubmit',
        'quizSubmit.userId = :userId',
        { userId },
      )
      .where('quiz.quizId = :quizId', { quizId })
      .orderBy('quiz.quizId', 'ASC')
      .addOrderBy('quizAnswer.itemIndex', 'ASC')
      .getOneOrFail();

    return quizzes;
  }

  async saveUserAnswer(userId: number, data: CreateQuizAnswerDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    // 트랜잭션 시작
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const multipleQuiz = await this.quizSubmitRepository.find({
      where: {
        user: { userId: userId }, // userId를 사용하여 user 엔티티와 매칭
        quiz: { quizId: data.quizId }, // quizId를 사용하여 quiz 엔티티와 매칭
        multipleAnswer: 1,
      },
    });
    const isFinished = multipleQuiz.some(
      (submission) => submission.status === 1,
    );
    if (multipleQuiz.length >= 3) {
      throw new HttpException(
        '더 이상 퀴즈를 제출할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    } else if (isFinished) {
      throw new HttpException(
        '이미 정답으로 처리된 문제가 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const descriptiveQuiz = await this.quizSubmitRepository.findOne({
      where: {
        user: { userId: userId }, // userId를 사용하여 user 엔티티와 매칭
        quiz: { quizId: data.quizId }, // quizId를 사용하여 quiz 엔티티와 매칭
        multipleAnswer: 0,
      },
    });
    if (descriptiveQuiz) {
      if (descriptiveQuiz.status === 0) {
        throw new HttpException(
          '아직 채점이 완료되지 않았습니다.',
          HttpStatus.BAD_REQUEST,
        );
      } else if (descriptiveQuiz.status === 1) {
        throw new HttpException(
          '이미 정답 처리 된 문제입니다.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      if (data.multipleAnswer) {
        const quizAnswers = await this.quizAnswerRepository.find({
          where: {
            quiz: { quizId: data.quizId },
            isAnswer: true,
          },
        });
        const correctAnswers = quizAnswers.map((answer) => answer.itemIndex);

        // 사용자가 제출한 답안 파싱
        const submittedAnswers = JSON.parse(data.answer);

        // 정답 일치 검사
        const isCorrect =
          correctAnswers.sort().toString() ===
          submittedAnswers.sort().toString();

        const quizSubmit = this.quizSubmitRepository.create({
          user: { userId },
          quiz: { quizId: data.quizId },
          multipleAnswer: 1,
          answer: data.answer,
          status: isCorrect ? 1 : 2, // 정답이면 1, 오답이면 2로 상태 설정
        });
        // await this.quizSubmitRepository.save(quizSubmit);
        await queryRunner.manager.save(quizSubmit);
      } else if (!descriptiveQuiz) {
        const descriptiveAnswer = this.quizSubmitRepository.create({
          user: { userId },
          quiz: { quizId: data.quizId },
          multipleAnswer: 0,
          answer: data.answer,
          status: 0,
        });
        // await this.quizSubmitRepository.save(descriptiveAnswer);
        await queryRunner.manager.save(descriptiveAnswer);
      } else {
        await queryRunner.manager.update(
          QuizSubmit,
          {
            user: { userId },
            quiz: { quizId: data.quizId },
          },
          {
            status: 0,
            answer: data.answer,
          },
        );
      }
      await queryRunner.commitTransaction();
      return { message: '퀴즈가 성공적으로 제출되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 연결 해제
      await queryRunner.release();
    }
  }

  async findMyCoursesByQuiz(userId: number): Promise<any[]> {
    // 1. 사용자가 등록한 강의 정보 가져오기
    const enrollments = await this.enrollmentRepository.find({
      where: { user: { userId } },
      relations: ['course'],
      select: {
        id: true,
        completedNumber: true,
        course: {
          courseId: true,
          title: true,
        },
      },
    });

    if (enrollments.length === 0) {
      return [];
    }

    const courseIds = enrollments.map(
      (enrollment) => enrollment.course.courseId,
    );

    // 2. 각 강의의 전체 강의 수 가져오기
    const lectureCountByCourse = await this.lectureRepository
      .createQueryBuilder('lecture')
      .select('lecture.courseId', 'courseId')
      .addSelect('COUNT(lecture.lectureId)', 'lectureCount')
      .where('lecture.courseId IN (:...courseIds)', { courseIds })
      .groupBy('lecture.courseId')
      .getRawMany();

    // 3. 각 강의별 강의 정보 가져오기
    let lectures = [];
    if (courseIds.length > 0) {
      lectures = await this.lectureRepository
        .createQueryBuilder('lecture')
        .select(['lecture.lectureId', 'lecture.title', 'lecture.courseId'])
        .where('lecture.courseId IN (:...courseIds)', { courseIds })
        .getMany();
    }

    // 4. 사용자가 제출한 모든 퀴즈 정보 가져오기
    let quizSubmits = [];
    if (courseIds.length > 0) {
      quizSubmits = await this.quizSubmitRepository
        .createQueryBuilder('quizSubmit')
        .leftJoinAndSelect('quizSubmit.quiz', 'quiz')
        .leftJoinAndSelect('quiz.lecture', 'lecture')
        .where('quizSubmit.userId = :userId', { userId })
        .andWhere('lecture.courseId IN (:...courseIds)', { courseIds })
        .getMany();
    }

    // 5. 데이터 구조화
    // 강의별로 퀴즈 제출 데이터 그룹핑
    const submitsByLecture = groupBy(
      quizSubmits,
      (submit) => submit.quiz.lecture.lectureId,
    );

    // 강의별로 통계 계산
    const lectureStats = lectures.map((lecture) => {
      const lectureSubmits = submitsByLecture[lecture.lectureId] || [];

      // 퀴즈별로 그룹핑 (한 퀴즈에 여러번 제출할 수 있으므로)
      const submitsByQuiz = groupBy(
        lectureSubmits,
        (submit) => submit.quiz.quizId,
      );

      const submittedQuizCount = Object.keys(submitsByQuiz).length;

      // 각 퀴즈별로 정답 여부 확인 (status가 1인 제출이 있으면 정답)
      const correctQuizCount = Object.values(submitsByQuiz).filter(
        (quizSubmits) => quizSubmits.some((submit) => submit.status === 1),
      ).length;

      const correctRatio =
        submittedQuizCount > 0 ? correctQuizCount / submittedQuizCount : 0;

      return {
        lectureId: lecture.lectureId,
        lectureTitle: lecture.title,
        courseId: lecture.courseId,
        submittedQuizCount,
        correctQuizCount,
        correctRatio: Math.round(correctRatio * 100) / 100, // 소수점 2자리까지
      };
    });

    // 코스별로 강의 그룹핑
    const lecturesByCoourse = groupBy(
      lectureStats,
      (lecture) => lecture.courseId,
    );

    // 최종 결과 구조화
    const result = enrollments.map((enrollment) => {
      const courseId = enrollment.course.courseId;
      const courseLectures = lecturesByCoourse[courseId] || [];

      // 강의 수 가져오기
      const lectureCountInfo = lectureCountByCourse.find(
        (count) => count.courseId === courseId,
      );
      const lectureCount = lectureCountInfo
        ? parseInt(lectureCountInfo.lectureCount)
        : 0;

      // 평균 정답률 계산
      const averageCorrectRatio =
        courseLectures.length > 0
          ? courseLectures.reduce(
              (sum, lecture) => sum + lecture.correctRatio,
              0,
            ) / courseLectures.length
          : 0;

      return {
        courseId,
        courseTitle: enrollment.course.title,
        lectureCount,
        completedNumber: enrollment.completedNumber,
        averageCorrectRatio: Math.round(averageCorrectRatio * 100) / 100, // 소수점 2자리까지
        lectures: courseLectures.map((lecture) => ({
          courseId: lecture.courseId,
          lectureId: lecture.lectureId,
          lectureTitle: lecture.lectureTitle,
          submittedQuizCount: lecture.submittedQuizCount,
          correctQuizCount: lecture.correctQuizCount,
          correctRatio: lecture.correctRatio,
        })),
      };
    });

    return result;
  }

  async findMyQuizzes(userId: number, courseId: number): Promise<any> {
    // 1. 코스 정보 가져오기
    const course = await this.courseRepository.findOne({
      where: { courseId },
      select: ['courseId', 'title'],
    });

    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    // 2. 해당 코스의 강의 정보 가져오기 (lecture number 순으로 정렬)
    const lectures = await this.lectureRepository.find({
      where: { course: { courseId } },
      select: ['lectureId', 'title', 'lectureNumber', 'courseId'],
      order: { lectureNumber: 'ASC' },
    });

    // 3. 사용자가 해당 강의들에서 제출한 퀴즈 제출 정보 가져오기 (생성일 순으로 정렬)
    const quizSubmits = await this.quizSubmitRepository.find({
      where: {
        user: { userId },
        quiz: { lecture: { course: { courseId } } },
      },
      relations: ['quiz', 'quiz.lecture'],
      order: { createdAt: 'ASC' },
    });

    // 4. 퀴즈 정보 가져오기
    const quizIds = [
      ...new Set(quizSubmits.map((submit) => submit.quiz.quizId)),
    ];

    let quizzes = [];
    if (quizIds.length > 0) {
      quizzes = await this.quizRepository
        .createQueryBuilder('quiz')
        .leftJoinAndSelect('quiz.lecture', 'lecture')
        .where('quiz.quizId IN (:...quizIds)', { quizIds })
        .getMany();
    }

    // 5. 퀴즈 답안 정보 가져오기 (itemIndex 순으로 정렬)
    let quizAnswers = [];
    if (quizIds.length > 0) {
      quizAnswers = await this.quizAnswerRepository
        .createQueryBuilder('quizAnswer')
        .where('quizAnswer.quizId IN (:...quizIds)', { quizIds })
        .orderBy('quizAnswer.itemIndex', 'ASC')
        .getMany();
    }

    // 6. 데이터 구조화
    // 퀴즈 제출 데이터를 퀴즈별로 그룹핑
    const groupedSubmits = groupBy(quizSubmits, (submit) => submit.quiz.quizId);

    // 퀴즈 답안을 퀴즈별로 그룹핑
    const groupedAnswers = groupBy(quizAnswers, (answer) => answer.quizId);

    // 강의별로 퀴즈를 그룹핑하고 구조화
    const lecturesWithQuizzes = lectures
      .map((lecture) => {
        // 해당 강의의 퀴즈들 찾기
        const lectureQuizzes = quizzes
          .filter((quiz) => quiz.lecture.lectureId === lecture.lectureId)
          .map((quiz) => ({
            quizId: quiz.quizId,
            quizType: quiz.quizType,
            quizIndex: quiz.quizIndex,
            question: quiz.question,
            quizSubmits: (groupedSubmits[quiz.quizId] || []).map((submit) => ({
              multipleAnswer: submit.multipleAnswer,
              answer: submit.answer,
              feedbackComment: submit.feedbackComment,
              status: submit.status,
              createdAt: submit.createdAt,
              updatedAt: submit.updatedAt,
            })),
            quizAnswers: (groupedAnswers[quiz.quizId] || []).map((answer) => ({
              id: answer.id,
              itemIndex: answer.itemIndex,
              isAnswer: answer.isAnswer ? 1 : 0,
              item: answer.item,
            })),
          }));

        return {
          lectureId: lecture.lectureId,
          lectureTitle: lecture.title,
          quizzes: lectureQuizzes,
        };
      })
      .filter((lecture) => lecture.quizzes.length > 0); // 퀴즈가 있는 강의만 반환

    return {
      courseId: course.courseId,
      courseTitle: course.title,
      lectures: lecturesWithQuizzes,
    };
  }
}
