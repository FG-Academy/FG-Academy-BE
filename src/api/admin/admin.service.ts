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
    console.log(updateCourseDto.lectures);
    const course = await this.courseRepository.findOne({
      where: { courseId },
      relations: ['lectures', 'lectures.quizzes'],
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // if (updateCourseDto.title !== undefined)
    //   course.title = updateCourseDto.title;
    // if (updateCourseDto.level !== undefined)
    //   course.level = updateCourseDto.level;
    // if (updateCourseDto.description !== undefined)
    //   course.description = updateCourseDto.description;
    // if (updateCourseDto.curriculum !== undefined)
    //   course.curriculum = updateCourseDto.curriculum;
    // if (updateCourseDto.openDate !== undefined)
    //   course.openDate = updateCourseDto.openDate;
    // if (updateCourseDto.finishDate !== undefined)
    //   course.finishDate = updateCourseDto.finishDate;
    // if (updateCourseDto.thumbnailImage !== undefined)
    //   course.thumbnailImagePath = updateCourseDto.thumbnailImage.path;

    course.title = updateCourseDto.title ?? course.title;
    course.level = updateCourseDto.level ?? course.level;
    course.description = updateCourseDto.description ?? course.description;
    course.curriculum = updateCourseDto.curriculum ?? course.curriculum;
    course.openDate = updateCourseDto.openDate ?? course.openDate;
    course.finishDate = updateCourseDto.finishDate ?? course.finishDate;
    if (updateCourseDto.thumbnailImage) {
      course.thumbnailImagePath = updateCourseDto.thumbnailImage.path;
    }

    if (updateCourseDto.lectures && course.lectures) {
      const existingLectureIds = course.lectures.map(
        (lecture) => lecture.lectureId,
      );
      updateCourseDto.lectures.forEach((dto) => {
        const lectureDto = plainToInstance(LectureDto, dto);
        console.log(lectureDto, typeof lectureDto);
        if (
          lectureDto.lectureId &&
          existingLectureIds.includes(lectureDto.lectureId)
        ) {
          const lecture = course.lectures.find(
            (l) => l.lectureId === lectureDto.lectureId,
          );
          lecture.title = lectureDto.title;
          lecture.videoLink = lectureDto.videoLink;
          lecture.lectureNumber = lectureDto.lectureNumber;
          lecture.status = 'active';
          console.log('lecture', lecture);
        } else if (!lectureDto.lectureId) {
          const newLecture = new Lecture();
          newLecture.courseId = courseId;
          newLecture.title = lectureDto.title;
          newLecture.videoLink = lectureDto.videoLink;
          newLecture.lectureNumber = lectureDto.lectureNumber;
          newLecture.status = 'active';
          console.log(newLecture);
          course.lectures.push(newLecture);
        }
      });
    }

    await this.courseRepository.manager.transaction(async (entityManager) => {
      await entityManager.save(course.lectures); // Save all lectures (new and updated)
      await entityManager.save(course); // Save the course with all changes
    });

    // if (updateCourseDto.lectures && course.lectures) {
    //   // Iterate through each existing lecture in the course
    //   course.lectures.forEach((lecture) => {
    //     const lectureData = updateCourseDto.lectures.find(
    //       (l) => l.lectureId === lecture.lectureId,
    //     );
    //     if (lectureData) {
    //       lecture.title = lectureData.title;
    //       lecture.videoLink = lectureData.videoLink;
    //       lecture.lectureNumber = lectureData.lectureNumber;
    //       lecture.status = 'active'; // Ensure they are marked active
    //     } else if (lecture.status !== 'deleted') {
    //       // Mark as deleted if not included in the updated DTO
    //       lecture.status = 'deleted';
    //     }
    //   });

    //   // Add new lectures not currently in the database
    //   const newLectures = updateCourseDto.lectures
    //     .filter((l) => !l.lectureId)
    //     .map((lectureDto) => {
    //       const newLecture = new Lecture();
    //       newLecture.courseId = courseId;
    //       newLecture.title = lectureDto.title;
    //       newLecture.videoLink = lectureDto.videoLink;
    //       newLecture.lectureNumber = lectureDto.lectureNumber;
    //       newLecture.status = 'active';
    //       return newLecture;
    //       // course.lectures.push(newLecture);
    //     });
    //   // console.log(course);
    //   course.lectures.push(...newLectures);
    //   await this.lectureRepository.save(newLectures);
    // }

    // // Save all changes
    // await this.courseRepository.save(course);
  }
}
