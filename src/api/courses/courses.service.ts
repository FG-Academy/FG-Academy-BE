import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { In, Repository } from 'typeorm';
import { Lecture } from 'src/entities/lecture.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import moment from 'moment-timezone';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';

moment.tz.setDefault('Asia/Seoul');

@Injectable()
export class CoursesService {
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
    private quizRepository: Repository<Quiz>,
  ) {}

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find({
      where: { status: 'active' },
      relations: ['category'],
      order: { category: { order: 'ASC' }, title: 'ASC' },
    });
  }

  async findOne(courseId: number) {
    return await this.courseRepository.findOne({
      relations: ['category'],
      where: { courseId },
    });
  }

  async getAllLecturesByCourseId(courseId: number): Promise<any> {
    const lectures = await this.lectureRepository.find({
      where: { courseId },
      order: { lectureNumber: 'ASC' },
    });

    for (const lecture of lectures) {
      const multipleChoiceCount = await this.quizRepository.count({
        where: {
          lecture: {
            lectureId: lecture.lectureId,
          },
          quizType: 'multiple',
        },
      });

      const descriptiveCount = await this.quizRepository.count({
        where: {
          lecture: {
            lectureId: lecture.lectureId,
          },
          quizType: 'descriptive',
        },
      });

      lecture['multipleChoiceCount'] = multipleChoiceCount;
      lecture['descriptiveCount'] = descriptiveCount;
    }

    return lectures;
  }

  async getLecturesProgress(courseId: number, userId: number) {
    const lectures = await this.lectureRepository.find({
      where: { course: { courseId } },
      relations: ['lectureTimeRecords', 'quizzes.quizSubmits'],
    });

    const lectureProgresses = lectures.map((lecture) => {
      const progress = lecture.lectureTimeRecords.find(
        (lp) => lp.userId === userId,
      );

      return {
        lectureId: lecture.lectureId,
        lectureNumber: lecture.lectureNumber,
        completed: progress ? progress.status : false,
        progress: progress ? progress.playTime : 0,
      };
    });

    const completedCount = lectureProgresses.filter(
      (lp) => lp.completed,
    ).length;

    return {
      lectureProgresses,
      completedCount,
    };
  }

  async getLecturesProgress2(courseId: number, userId: number) {
    // 강의 목록만 먼저 가져오기
    const lectures = await this.lectureRepository.find({
      where: { course: { courseId } },
      select: ['lectureId', 'lectureNumber'], // 필요한 필드만 가져오기
    });

    // 각 강의에 대한 진행 상황을 별도로 가져오기
    const lectureIds = lectures.map((lecture) => lecture.lectureId);

    // LectureTimeRecords에서 userId에 해당하는 레코드만 가져오기
    const lectureTimeRecords = await this.lectureTimeRecordRepository.find({
      where: {
        lectureId: In(lectureIds),
        userId: userId,
      },
    });

    // 필요시 다른 테이블도 비슷한 방식으로 진행
    const lectureProgresses = lectures.map((lecture) => {
      const progress = lectureTimeRecords.find(
        (lp) => lp.lectureId === lecture.lectureId,
      );

      return {
        lectureId: lecture.lectureId,
        lectureNumber: lecture.lectureNumber,
        completed: progress ? progress.status : false,
        progress: progress ? progress.playTime : 0,
      };
    });

    const completedCount = lectureProgresses.filter(
      (lp) => lp.completed,
    ).length;

    return {
      lectureProgresses,
      completedCount,
    };
  }

  async enrollCourse(courseId: number, userId: number, level: string) {
    // 이미 사용자가 해당 코스에 대해서 수강신청을 완료했는지 확인
    const isExist = await this.enrollmentRepository.findOne({
      where: { user: { userId }, course: { courseId } },
    });

    const courseInfo = await this.courseRepository.findOne({
      where: { courseId: courseId },
    });

    // 사용자의 레벨이 코스 수강 최소 레벨에 도달하지 못하면 수강 신청 불가 (admin 제외)
    if (level !== 'admin') {
      const userLevel = parseInt(level[1]);
      const courseLevel = parseInt(courseInfo.level[1]);

      if (courseLevel > userLevel) {
        throw new HttpException(
          '수강할 수 있는 레벨이 아닙니다.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 코스 마감기한이 아닌데 수강 신청하려고 하는 경우 수강 신청 불가
    const courseCloseDate = courseInfo.finishDate;
    const courseStartDate = courseInfo.openDate;
    const currentDate = moment();

    if (!currentDate.isBetween(courseStartDate, courseCloseDate)) {
      throw new HttpException(
        '수강 가능한 날짜가 아닙니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isExist) {
      throw new HttpException(
        '이미 수강신청한 코스입니다.',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      const enrollmentRepo = this.enrollmentRepository.create({
        user: { userId: userId },
        course: { courseId: courseId },
      });

      await this.enrollmentRepository.save(enrollmentRepo);

      return { message: '수강신청을 성공적으로 완료했습니다!' };
    }
  }

  async getEnrollmentData(courseId: number, userId: number) {
    const isCourse = await this.courseRepository.findOne({
      where: { courseId },
    });

    if (!isCourse) {
      throw new HttpException('잘못된 코스입니다', HttpStatus.BAD_REQUEST);
    }

    // 사용자가 수강신청을 했는지 확인
    const isExist = await this.enrollmentRepository.findOne({
      where: { user: { userId }, course: { courseId } },
    });

    // 해당 코스의 전체 강의 개수
    const totalCourseLength = await this.lectureRepository.count({
      where: { courseId },
      select: { lectureId: true },
    });

    // 사용자가 해당 코스에서 수강완료한 강의 개수
    const completedLectures = await this.lectureTimeRecordRepository.find({
      where: {
        // status: true,
        userId,
        lecture: {
          course: { courseId }, // 특정 코스의 강의들 중에서 수강 완료한 강의를 찾는 조건 추가
        },
      },
      relations: ['lecture', 'lecture.course'], // 필요한 relation 명시
      order: {
        lecture: { lectureNumber: 'DESC' },
      },
    });

    const firstLecture = await this.lectureRepository.findOneBy({
      courseId,
      lectureNumber: 1,
    });

    // 사용자가 해당 코스에서 가장 마지막으로(최근에) 수강완료한 강의
    const completedLecture = completedLectures.filter(
      (cl) => cl.status === true,
    );

    const lastStudyLecture = completedLectures[0];

    if (
      totalCourseLength !== 0 &&
      totalCourseLength === completedLecture.length
    ) {
      return {
        isTaking: null,
        message: '수강완료',
        totalCount: totalCourseLength,
        completedLectures: completedLecture.length,
        lastStudyLecture: lastStudyLecture ? lastStudyLecture.lectureId : null,
      };
    }
    // 수강신청 이력이 남아있으면 이어듣기, 아니면 수강 신청하기
    if (isExist) {
      return {
        isTaking: true,
        message: '이어듣기',
        totalCount: totalCourseLength,
        completedLectures: completedLecture.length,
        lastStudyLecture: lastStudyLecture
          ? lastStudyLecture.lectureId
          : firstLecture
            ? firstLecture.lectureId
            : null,
      };
    } else {
      return {
        isTaking: false,
        message: '수강 신청하기',
        totalCount: totalCourseLength,
        completedLectures: 0,
        lastStudyLecture: firstLecture ? firstLecture.lectureId : null,
      };
    }
  }

  async findAllLecturesByCourseId(userId: number, courseId: number) {
    const course = await this.courseRepository.findOne({
      where: {
        courseId,
      },
      relations: [
        'lectures',
        'lectures.quizzes',
        'lectures.quizzes.quizAnswers',
        'lectures.quizzes.quizSubmits',
        'category',
        // 'lectures.lectureTimeRecords',
      ],
      order: {
        lectures: {
          lectureNumber: 'ASC',
          quizzes: { quizIndex: 'ASC', quizAnswers: { itemIndex: 'ASC' } },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // 각 lecture의 모든 관련 데이터를 userId에 맞게 필터링
    course.lectures.forEach((lecture) => {
      // 각 퀴즈의 quizSubmits 필터링
      lecture.quizzes.forEach((quiz) => {
        quiz.quizSubmits = quiz.quizSubmits.filter((quizSubmit) => {
          return quizSubmit.userId === userId;
        });
      });
    });

    return course;
  }

  async findAllLecturesByCourseId2(userId: number, courseId: number) {
    // course, lectures, category 데이터만 우선 조회
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['lectures', 'category'],
      order: {
        lectures: {
          lectureNumber: 'ASC',
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const lectureIds = course.lectures.map((lecture) => lecture.lectureId);

    // QueryBuilder를 사용하여 lectureId 포함한 퀴즈 정보 가져오기
    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.lecture', 'lecture')
      .where('quiz.lectureId IN (:...lectureIds)', { lectureIds })
      .select([
        'quiz.quizId', // quizId 가져오기
        'quiz.quizType', // quizType 가져오기
        'lecture.lectureId', // lectureId 가져오기
        'lecture.videoLink', // lectureId 가져오기
      ])
      .orderBy('quiz.quizId', 'ASC')
      .getMany();

    if (quizzes.length === 0) {
      return {
        ...course,
        lectures: course.lectures.map((lecture) => ({
          lectureId: lecture.lectureId,
          lectureNumber: lecture.lectureNumber,
          lectureTitle: lecture.title,
          videoLink: lecture.videoLink,
          quizzes: [],
        })),
      };
    }

    // QueryBuilder를 사용하여 quizId와 userId를 기반으로 제출 여부 확인
    const quizSubmits = await this.quizSubmitRepository
      .createQueryBuilder('quizSubmit')
      .leftJoinAndSelect('quizSubmit.quiz', 'quiz')
      .where('quizSubmit.quizId IN (:...quizIds)', {
        quizIds: quizzes.map((quiz) => quiz.quizId),
      })
      .andWhere('quizSubmit.userId = :userId', { userId })
      .getMany();

    // 제출 여부 확인 및 새로운 객체 생성
    const lecturesWithQuizzes = course.lectures.map((lecture) => {
      const filteredQuizzes = quizzes
        .filter((quiz) => quiz.lecture.lectureId === lecture.lectureId)
        .map((quiz) => ({
          quizId: quiz.quizId,
          quizType: quiz.quizType,
          submitted: quizSubmits.some(
            (submit) => submit.quiz.quizId === quiz.quizId,
          ),
        }));

      return {
        lectureId: lecture.lectureId,
        lectureNumber: lecture.lectureNumber,
        lectureTitle: lecture.title,
        videoLink: lecture.videoLink,
        quizzes: filteredQuizzes, // 새롭게 정의된 퀴즈 정보
      };
    });

    return {
      ...course,
      lectures: lecturesWithQuizzes, // 퀴즈 정보가 추가된 lectures를 포함
    };
  }

  async getLectureRecords(lectureId: number, userId: number) {
    const lecture = await this.lectureRepository.findOne({
      where: { lectureId },
      relations: ['lectureTimeRecords'],
    });

    if (!lecture) {
      throw new HttpException('잘못된 강의입니다', HttpStatus.BAD_REQUEST);
    }

    const lectureRecords = await this.lectureTimeRecordRepository.findOneBy({
      lecture: { lectureId },
      userId,
    });

    if (lectureRecords) {
      return lectureRecords;
    } else {
      const newRecord = this.lectureTimeRecordRepository.create({
        lectureId,
        userId,
        playTime: 0,
      });
      const newLectureRecords =
        await this.lectureTimeRecordRepository.save(newRecord);
      return newLectureRecords;
    }
  }
}
