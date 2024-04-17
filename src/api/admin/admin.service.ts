import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  Injectable,
  // NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Repository } from 'typeorm';
import { Lecture } from 'src/entities/lecture.entity';
import { LectureDto, UpdateCourseDto } from './dto/update-course.dto';
import { User } from 'src/entities/user.entity';
import { UpdateLecturesDto } from './dto/update-lectures.dto';

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
    });

    // 각 코스별로 수강 인원 수를 계산합니다.
    courses.forEach((course) => {
      // enrollments 관계를 통해 수강 인원 수를 세고 새 속성에 할당합니다.
      course['enrollmentCount'] = course.enrollments.length;
    });

    return courses;
  }

  async findOne(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['enrollments', 'lectures'], // course 엔티티에서 enrollments와 lectures를 로드
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async updateCourse(courseId: number, updateCourseDto: UpdateCourseDto) {
    console.log(updateCourseDto);
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['lectures'],
    });

    if (!course) {
      throw new Error('Course not found');
    }

    course.title = updateCourseDto.title ?? course.title;
    course.level = updateCourseDto.level ?? course.level;
    course.description = updateCourseDto.description ?? course.description;
    course.curriculum = updateCourseDto.curriculum ?? course.curriculum;
    course.openDate = updateCourseDto.openDate ?? course.openDate;
    course.finishDate = updateCourseDto.finishDate ?? course.finishDate;
    if (updateCourseDto.thumbnailImage) {
      course.thumbnailImagePath = updateCourseDto.thumbnailImage.path;
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
  }
}
