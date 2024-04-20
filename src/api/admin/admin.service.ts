import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  Injectable,
  NotFoundException,
  // NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { In, Repository } from 'typeorm';
import { Lecture } from 'src/entities/lecture.entity';
import { LectureDto, UpdateCourseDto } from './dto/update-course.dto';
import { User } from 'src/entities/user.entity';
import { UpdateLecturesDto } from './dto/update-lectures.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {}

  async findAllUsers() {
    const user = await this.userRepository.find({
      relations: ['enrollments'],
    });

    return instanceToPlain(user);
  }

  async findUserById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        userId,
      },
      select: {
        enrollments: {
          id: true,
          completedNumber: true,
          course: { courseId: true, title: true },
        },
        // your other columns from order entity.
      },
      relations: ['enrollments', 'enrollments.course'],
    });
    console.log(user);
    return instanceToPlain(user);
  }

  async findAll(): Promise<Course[]> {
    // 모든 코스를 가져옵니다.
    const courses = await this.courseRepository.find({
      relations: ['enrollments'],
      where: { status: In(['active', 'inactive']) },
    });

    // 각 코스별로 수강 인원 수를 계산합니다.
    courses.forEach((course) => {
      // enrollments 관계를 통해 수강 인원 수를 세고 새 속성에 할당합니다.
      course['enrollmentCount'] = course.enrollments.length;
    });

    return courses;
  }

  async createCourse(createCourseDto: CreateCourseDto, filepath: string) {
    const newCourseData = this.courseRepository.create({
      thumbnailImagePath: filepath,
      ...createCourseDto,
    });
    console.log(newCourseData);

    await this.courseRepository.save(newCourseData);

    return { message: 'Success' };
  }

  async deleteCourses(deleteCourseDto: DeleteCourseDto) {
    const courseIds = deleteCourseDto.courseIds;
    try {
      const deleteCourses = await this.courseRepository.find({
        where: { courseId: In(courseIds) },
      });
      deleteCourses.forEach((course) => {
        course.status = 'deleted';
      });
      // 변경된 상태를 저장
      await this.courseRepository.save(deleteCourses);
    } catch {
      throw new NotFoundException('존재하지 않는 코스입니다.');
    }
  }

  async findOne(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['enrollments', 'lectures'],
      order: {
        lectures: {
          lectureNumber: 'ASC', // Sort lectures by lectureNumber in ascending order
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Filter active lectures manually after fetching
    course.lectures = course.lectures.filter(
      (lecture) => lecture.status === 'active',
    );

    return course;
  }

  async updateCourse(
    courseId: number,
    updateCourseDto: UpdateCourseDto,
    filepath: string,
  ) {
    console.log(updateCourseDto);
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['lectures'],
    });

    if (!course) {
      throw new Error('Course not found');
    }

    course.title = updateCourseDto.title ?? course.title;
    course.status = updateCourseDto.status ?? course.status;
    course.level = updateCourseDto.level ?? course.level;
    course.description = updateCourseDto.description ?? course.description;
    course.curriculum = updateCourseDto.curriculum ?? course.curriculum;
    course.openDate = updateCourseDto.openDate ?? course.openDate;
    course.finishDate = updateCourseDto.finishDate ?? course.finishDate;
    if (filepath) {
      course.thumbnailImagePath = filepath;
    }

    await this.courseRepository.save(course); // Save the course with all changes
  }

  async updateLectures(courseId: number, updateLecturesDto: UpdateLecturesDto) {
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['lectures'],
    });
    if (!course) {
      throw new Error('Course not found');
    }
    const existingLectureIds = course.lectures.map(
      (lecture) => lecture.lectureId,
    );
    const dtoLectureIds = updateLecturesDto.lectures.map(
      (dto) => dto.lectureId,
    );
    for (const dto of updateLecturesDto.lectures) {
      const lectureDto = plainToInstance(LectureDto, dto);
      if (
        lectureDto.lectureId &&
        existingLectureIds.includes(lectureDto.lectureId)
      ) {
        const lecture = course.lectures.find(
          (l) => l.lectureId === lectureDto.lectureId,
        );
        // lecture.courseId = courseId;
        lecture.title = lectureDto.title;
        lecture.videoLink = lectureDto.videoLink;
        lecture.lectureNumber = lectureDto.lectureNumber;
        lecture.status = 'active';
        await this.lectureRepository.save(lecture);
      } else {
        const newLecture = new Lecture();
        newLecture.courseId = courseId;
        newLecture.title = lectureDto.title;
        newLecture.videoLink = lectureDto.videoLink;
        newLecture.lectureNumber = lectureDto.lectureNumber;
        newLecture.status = 'active';
        course.lectures.push(newLecture);
        await this.lectureRepository.save(newLecture);
      }
    }
    for (const existingId of existingLectureIds) {
      if (!dtoLectureIds.includes(existingId)) {
        const lectureToMarkDeleted = course.lectures.find(
          (l) => l.lectureId === existingId,
        );
        if (lectureToMarkDeleted) {
          lectureToMarkDeleted.status = 'deleted';
          await this.lectureRepository.save(lectureToMarkDeleted);
        }
      }
    }
  }

  async findAllCurriculums() {
    const uniqueCurriculums = await this.courseRepository
      .createQueryBuilder('course')
      .select('DISTINCT(course.curriculum)', 'curriculum') // 'curriculum'은 SELECT에서 반환될 레이블입니다.
      .getRawMany();

    // 'curriculum' 레이블로 추출된 결과만 배열로 반환합니다.
    return uniqueCurriculums.map((entry) => entry.curriculum);
  }
}
