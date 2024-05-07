import {
  HttpException,
  HttpStatus,
  Injectable,
  // NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { Lecture } from 'src/entities/lecture.entity';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { Enrollment } from 'src/entities/enrollment.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import moment from 'moment-timezone';

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
  ) {}

  async createCourse(createCourseDto: CreateCourseDto) {
    const { thumbnailImage, ...courseData } = createCourseDto;

    createCourseDto.thumbnailImage = thumbnailImage;

    const newCourseData = this.courseRepository.create({
      thumbnailImagePath: thumbnailImage.path,
      ...courseData,
    });

    await this.courseRepository.save(newCourseData);

    return { message: 'Success' };
  }

  async findAll(): Promise<Course[]> {
    return await this.courseRepository.find();
  }

  async findOne(courseId: number) {
    return await this.courseRepository.findOne({ where: { courseId } });
  }

  async createLecturesByCourseId(
    courseId: number,
    createLectureDtos: CreateLectureDto[],
  ) {
    const course = await this.courseRepository.findOne({
      where: { courseId },
    });
    if (!course) {
      throw new UnprocessableEntityException(
        `Course with ID "${courseId}" not found`,
      );
    }

    const newLectures = createLectureDtos.map((lecture) => {
      return this.lectureRepository.create({
        ...lecture,
        courseId,
      });
    });

    await this.lectureRepository.insert(newLectures);

    return true;
  }

  async getAllLecturesByCourseId(
    courseId: number,
    userId: number,
  ): Promise<any> {
    const course = await this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.lectures', 'lecture')
      .leftJoinAndSelect('lecture.quizzes', 'quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect(
        'quiz.quizSubmits',
        'quizSubmit',
        'quizSubmit.userId = :userId',
        { userId },
      )
      .leftJoinAndSelect(
        'lecture.lectureTimeRecords',
        'lectureTimeRecord',
        'lectureTimeRecord.userId = :userId',
        { userId },
      )
      .where('course.courseId = :courseId', { courseId })
      .orderBy('lecture.lectureNumber', 'ASC')
      .addOrderBy('quiz.quizId', 'ASC')
      .addOrderBy('quizAnswer.id', 'ASC')
      .getOne();

    return course.lectures;
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
        // quizCompleted:
        progress: progress ? progress.playTime : 0,
      };
    });

    const completedCount = lectureProgresses.filter(
      (lp) => lp.completed,
    ).length;

    return {
      lectureProgresses,
      completedCount,
      // progressPercentage: completedCount > 0 ? (completedCount / lectures.length) * 100 : 0,
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
      try {
        const enrollmentRepo = this.enrollmentRepository.create({
          user: { userId: userId },
          course: { courseId: courseId },
        });

        await this.enrollmentRepository.save(enrollmentRepo);

        return { message: '수강신청을 성공적으로 완료했습니다!' };
      } catch (err) {
        throw err;
      }
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
        status: true,
        userId,
        lecture: {
          course: { courseId }, // 특정 코스의 강의들 중에서 수강 완료한 강의를 찾는 조건 추가
        },
      },
      relations: ['lecture', 'lecture.course'], // 필요한 relation 명시
      order: {
        updatedAt: 'DESC', // 가장 최근에 업데이트된 순서로 정렬
      },
    });
    // 사용자가 해당 코스에서 가장 마지막으로(최근에) 수강완료한 강의
    const lastStudyLecture = completedLectures[0];

    if (totalCourseLength === completedLectures.length) {
      console.log('object');
      return {
        isTaking: null,
        message: '수강완료',
        totalCount: totalCourseLength,
        completedLectures: completedLectures.length,
        lastStudyLecture: lastStudyLecture?.lectureId
          ? lastStudyLecture.lectureId
          : null,
      };
    }
    // 수강신청 이력이 남아있으면 이어듣기, 아니면 수강 신청하기
    if (isExist) {
      return {
        isTaking: true,
        message: '이어듣기',
        totalCount: totalCourseLength,
        completedLectures: completedLectures.length,
        lastStudyLecture: lastStudyLecture?.lectureId
          ? lastStudyLecture.lectureId
          : null,
      };
    } else
      return {
        isTaking: false,
        message: '수강 신청하기',
        totalCount: totalCourseLength,
        completedLectures: 0,
        lastStudyLecture: null,
      };
  }
}
