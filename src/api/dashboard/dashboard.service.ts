import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(LectureTimeRecord)
    private readonly lectureTimeRecordRepository: Repository<LectureTimeRecord>,
    @InjectRepository(QuizSubmit)
    private readonly quizSubmitRepository: Repository<QuizSubmit>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {}

  async findAll(userId: number) {
    const userEnrollments = await this.enrollmentRepository.find({
      where: { user: { userId }, course: { status: 'active' } },
      relations: ['course'],
    });

    const courseDetail = await Promise.all(
      userEnrollments.map(async (enrollment) => {
        const courseId = enrollment.course.courseId;

        // 해당 코스에 속한 강의 총 개수
        const totalCourseLength = await this.lectureRepository.count({
          where: { course: { courseId, status: 'active' } },
        });

        // 사용자가 수강 완료한 강의 개수
        const completedLecturesLength =
          await this.lectureTimeRecordRepository.count({
            where: {
              user: { userId },
              lecture: { course: { courseId } },
              status: true,
            },
          });

        const lastStudyLecture = await this.lectureTimeRecordRepository.findOne(
          {
            where: { user: { userId }, lecture: { course: { courseId } } },
            relations: ['lecture'],
            order: { updatedAt: 'DESC' },
          },
        );

        return {
          courseId,
          title: enrollment.course.title,
          curriculum: enrollment.course.curriculum,
          thumbnailPath: enrollment.course.thumbnailImagePath,
          totalCourseLength: totalCourseLength,
          completedLectures: completedLecturesLength,
          lastStudyLectureId: lastStudyLecture.lectureId,
        };
      }),
    );

    return {
      message: '성공적으로 로드했습니다.',
      courseDetail,
    };
  }

  async findQuizList(userId: number): Promise<any[]> {
    // 사용자가 제출한 모든 퀴즈 정보와 그 답안들을 조회합니다.
    const submittedQuizzes = await this.quizSubmitRepository
      .createQueryBuilder('quizSubmit')
      .leftJoinAndSelect('quizSubmit.quiz', 'quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect('quiz.lecture', 'lecture')
      .leftJoinAndSelect('lecture.course', 'course') // 강의가 속한 코스를 추가로 불러옵니다.
      .where('quizSubmit.userId = :userId', { userId })
      .getMany();
    console.log(submittedQuizzes);

    // quizId를 기준으로 제출된 퀴즈들을 그룹화합니다.
    const quizMap = new Map();

    submittedQuizzes.forEach((submit) => {
      const quizId = submit.quiz.quizId;
      if (!quizMap.has(quizId)) {
        const correctAnswers = submit.quiz.quizAnswers
          .filter((answer) => answer.isAnswer)
          .map((answer) => ({
            itemIndex: answer.itemIndex,
            item: answer.item,
          }));

        quizMap.set(quizId, {
          quizId: quizId,
          question: submit.quiz.question,
          submittedAnswer: [],
          submittedAnswersContents: [],
          isAnswer: true, // 초기에는 true로 설정하고, 나중에 검증
          lectureTitle: submit.quiz.lecture.title, // 강의 제목
          courseTitle: submit.quiz.lecture.course.title, // 코스 제목
          correctAnswers: correctAnswers,
        });
      }
      const quizEntry = quizMap.get(quizId);

      quizEntry.submittedAnswer.push(submit.multipleAnswer);

      quizEntry.submittedAnswersContents.push(
        submit.quiz.quizAnswers.find(
          (answer) => answer.itemIndex === submit.multipleAnswer,
        )?.item || '답안 없음',
      );
      // 모든 제출된 답안이 정답인지 확인하여 하나라도 틀리면 isAnswer를 false로 설정합니다.
      if (
        !submit.quiz.quizAnswers.some(
          (answer) =>
            answer.isAnswer && answer.itemIndex === submit.multipleAnswer,
        )
      ) {
        quizEntry.isAnswer = false;
      }
      if (submit.quiz.quizType !== 'multiple') {
        if (submit.status === 0) quizEntry.isAnswer = null;
        else if (submit.status === 1) quizEntry.isAnswer = true;
        else if (submit.status === 2) quizEntry.isAnswer = false;
      }
    });

    // Map의 값들을 배열로 변환하여 반환합니다.
    return Array.from(quizMap.values()).map((quiz) => ({
      ...quiz,
      submittedAnswersContents: [...new Set(quiz.submittedAnswersContents)], // 중복 제거
    }));
  }

  //   {
  //     "quizId": 8,
  //     "question": "\"잊고 서있는 사람이 되고 싶었어\" 다음에 나올 단어는?",
  //     "submittedAnswer": [
  //         0
  //     ],
  //     "submittedAnswersContents": [
  //         "답안 없음"
  //     ],
  //     "isAnswer": false,
  //     "lectureTitle": "동그라미",
  //     "courseTitle": "코스 11",
  //     "correctAnswers": []
  // }

  async findQuizList2(userId: number): Promise<any[]> {
    // 사용자가 제출한 모든 퀴즈 정보와 그 답안들을 조회합니다.
    const submittedQuizzes = await this.quizSubmitRepository.find({
      where: {
        userId,
        quiz: { lecture: { status: 'active', course: { status: 'active' } } },
      },
      relations: [
        'quiz',
        'quiz.quizAnswers',
        'quiz.lecture',
        'quiz.lecture.course',
      ],
      order: {
        quiz: {
          quizAnswers: { itemIndex: 'ASC' },
          lecture: { lectureNumber: 'ASC' },
        },
      },
    });

    const quizMap = new Map();

    submittedQuizzes.forEach((sq) => {
      if (sq.multipleAnswer === 1) {
        const existingQuiz = quizMap.get(sq.quiz.quizId);
        if (
          !existingQuiz ||
          new Date(sq.updatedAt) > new Date(existingQuiz.updatedAt)
        ) {
          quizMap.set(sq.quiz.quizId, sq);
        }
      } else {
        quizMap.set(`${sq.quiz.quizId}-${sq.id}`, sq);
      }
    });

    const filteredQuizzes = Array.from(quizMap.values());

    // 퀴즈 정보를 원하는 형식으로 변환합니다.
    const quizList = filteredQuizzes.map((sq) => {
      return {
        quizId: sq.quiz.quizId,
        question: sq.quiz.question,
        answer: sq.answer,
        multipleAnswer: sq.multipleAnswer,
        isAnswer: sq.status,
        lectureTitle: sq.quiz.lecture.title,
        courseTitle: sq.quiz.lecture.course.title,
        feedback: sq.feedbackComment,
        quizAnswers: sq.quiz.quizAnswers,
      };
    });

    return quizList;
  }
}
