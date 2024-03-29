import {
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

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}

  async createCourse(createCourseDto: CreateCourseDto) {
    const { thumbnailImage, ...courseData } = createCourseDto;

    createCourseDto.thumbnailImage = thumbnailImage;

    const newCourseData = this.courseRepository.create({
      thumbnailImagePath: thumbnailImage.path,
      ...courseData,
    });

    console.log(typeof thumbnailImage.path);
    console.log(newCourseData);

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
      // console.log(lecture);
      return this.lectureRepository.create({
        ...lecture,
        courseId,
      });
    });
    // console.log(newLectures);

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

    // console.log(course);

    return course.lectures;
  }

  // async getAllLecturesByCourseId(courseId: number): Promise<any> {
  //   const result = await this.lectureRepository.find({
  //     relations: ['course'],
  //     where: { courseId },
  //   });

  //   if (!result) {
  //     throw new NotFoundException(`Lectures with ID "${courseId}" not found`);
  //   }

  //   // const lectures = result.reduce((acc, lecture) => {
  //   //   const { lectureId, ...rest } = lecture;
  //   //   acc[lectureId] = rest;
  //   //   return acc;
  //   // }, {});

  //   // console.log(lecturesObject[3]);
  //   return result;
  //   // return { lectures, length: result.length };
  // }

  async getLecturesProgress(courseId: number, userId: number) {
    const lectures = await this.lectureRepository.find({
      where: { course: { courseId } },
      relations: ['lectureTimeRecords', 'quizzes.quizSubmits'],
    });

    // console.log(lectures[0].quizzes);

    const lectureProgresses = lectures.map((lecture) => {
      // console.log(lecture);
      const progress = lecture.lectureTimeRecords.find(
        (lp) => lp.userId === userId,
      );
      // console.log(progress);

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
}
