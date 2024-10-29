import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { LectureDto, UpdateCourseDto } from './dto/update-course.dto';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizAnswer } from 'src/entities/quizAnswer.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { User } from 'src/entities/user.entity';
import { UpdateLecturesDto } from './dto/update-lectures.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';
import { DataSource, Repository, In } from 'typeorm';
import { FeedbackDescriptiveQuiz } from './dto/feedbackDescriptiveQuiz.dto';
import { CreateQuizDto } from './dto/create-new-quiz.dto';
import { FeedbackDto } from './dto/feedback.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { departments, positions } from './type/type';
import { CopyCourseDto } from './dto/copy-course.dto';
import { Enrollment } from 'src/entities/enrollment.entity';
import { CategoryDto, UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from 'src/entities/category.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
    private dataSource: DataSource,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAnswer)
    private quizAnswerRepository: Repository<QuizAnswer>,
    @InjectRepository(QuizSubmit)
    private quizSubmitRepository: Repository<QuizSubmit>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Lecture)
    private lectureRepository: Repository<Lecture>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /** 유저 정보 */
  // async findAllUsers() {
  //   const users = await this.usersRepository.find();
  //   const usersForResponse = users.map((user) => {
  //     const userPlain = instanceToPlain(user);

  //     const departmentLabel =
  //       departments.find((dept) => dept.value === user.departmentName)?.label ||
  //       'N/A';
  //     const positionLabel =
  //       positions.find((pos) => pos.value === user.position)?.label || 'N/A';

  //     return {
  //       ...userPlain,
  //       departmentLabel,
  //       positionLabel,
  //     };
  //   });

  //   return usersForResponse;
  // }

  async findAllUsers({
    page,
    size,
    sortBy,
    level,
    church,
    position,
    department,
    name,
  }) {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    if (sortBy === '') {
      sortBy = 'name';
    }

    // 필터링 조건 추가
    if (level) queryBuilder.andWhere('user.level = :level', { level });
    if (church) queryBuilder.andWhere('user.churchName = :church', { church });
    if (position)
      queryBuilder.andWhere('user.position = :position', { position });
    if (department)
      queryBuilder.andWhere('user.departmentName = :department', {
        department,
      });
    if (name)
      queryBuilder.andWhere('user.name LIKE :name', { name: `%${name}%` });

    // 전체 유저 수
    const totalElements = await queryBuilder.getCount();

    // 정렬 조건 추가
    if (sortBy === 'name') {
      queryBuilder.orderBy('user.name', 'ASC');
    } else if (sortBy === 'createdAt') {
      queryBuilder.orderBy('user.createdAt', 'DESC');
    } else if (sortBy === 'yearOfService') {
      queryBuilder.orderBy('user.yearOfService', 'ASC');
    }

    // 페이지네이션 적용
    queryBuilder.skip((page - 1) * size).take(size);
    const users = await queryBuilder.getMany();

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(totalElements / size);
    const currentPage = page;

    // 응답 데이터 포맷팅
    const usersForResponse = users.map((user) => {
      const userPlain = instanceToPlain(user);

      const departmentLabel =
        departments.find((dept) => dept.value === user.departmentName)?.label ||
        'N/A';
      const positionLabel =
        positions.find((pos) => pos.value === user.position)?.label || 'N/A';

      return {
        ...userPlain,
        departmentLabel,
        positionLabel,
      };
    });

    return {
      result: {
        currentPage,
        totalPages,
        totalElements,
        size,
        content: usersForResponse,
      },
    };
  }

  async findUserById(userId: number) {
    const user = await this.usersRepository.findOne({
      where: {
        userId,
      },
      relations: [
        'enrollments',
        'enrollments.course',
        'enrollments.course.lectures',
        // 'enrollments.course.lectures.lectureTimeRecords',
        'enrollments.course.lectures.quizzes',
        'enrollments.course.lectures.quizzes.quizSubmits',
        'enrollments.course.lectures.quizzes.quizAnswers',
      ],
      order: {
        enrollments: {
          course: {
            lectures: {
              lectureNumber: 'ASC',
              quizzes: { quizIndex: 'ASC', quizAnswers: { itemIndex: 'ASC' } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    // 모든 수강 신청을 포함하도록 수정
    const filteredEnrollments = user.enrollments;

    const mappedData = {
      // ...user,
      password: null,
      refreshToken: null,
      enrollments: filteredEnrollments.map((enrollment) => {
        const lectures = enrollment.course.lectures || [];
        let totalQuizCount = 0;
        let userSubmittedQuizCount = 0;
        let userCorrectQuizCount = 0;
        // let completedLecturesCount = 0;

        const mappedLectures = lectures.map((lecture) => {
          let lectureQuizTotalCount = 0;
          let lectureCorrectQuizCount = 0;

          const quizzes = lecture.quizzes.map((quiz) => {
            // console.log(quiz);
            const userSubmits = quiz.quizSubmits.filter(
              (submit) => submit.userId === userId,
            );

            let answerType = '미채점';
            let lastSubmit;
            if (userSubmits.length > 0) {
              lastSubmit = userSubmits.reduce((latest, current) =>
                new Date(latest.createdAt) > new Date(current.createdAt)
                  ? latest
                  : current,
              );
              answerType =
                lastSubmit.status === 1
                  ? '정답'
                  : lastSubmit.status === 0
                    ? '미채점'
                    : '오답';
            }

            const correctSubmits = userSubmits.filter(
              (submit) => submit.status === 1,
            );

            lectureQuizTotalCount++;
            if (userSubmits.length > 0) {
              userSubmittedQuizCount++;
            }
            if (correctSubmits.length > 0) {
              lectureCorrectQuizCount++;
              userCorrectQuizCount++;
            }

            totalQuizCount++;
            // console.log(totalQuizCount);

            return {
              quizId: quiz.quizId,
              quizAnswers: quiz.quizAnswers,
              quizType: quiz.quizType,
              question: quiz.question,
              answer: !lastSubmit
                ? null
                : lastSubmit.multipleAnswer === 1
                  ? JSON.parse(lastSubmit.answer)
                  : lastSubmit.answer,
              submitCount: userSubmits.length,
              correctCount: correctSubmits.length,
              answerType,
            };
          });

          // const hasCompletedLecture = lecture.lectureTimeRecords.some(
          //   (record) => record.userId === userId && record.status === true,
          // );

          // if (hasCompletedLecture) {
          //   completedLecturesCount++;
          // }

          return {
            lectureNumber: lecture.lectureNumber,
            lectureId: lecture.lectureId,
            lectureTitle: lecture.title,
            quizzes,
            quizTotalCount: lectureQuizTotalCount,
            correctQuizCount: lectureCorrectQuizCount,
          };
        });

        // totalLecturesCount와 completedLecturesCount 계산
        const totalLecturesCount = lectures.length;
        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.course.courseId,
          courseTitle: enrollment.course.title,
          totalLecturesCount,
          // completedLecturesCount,
          totalQuizCount: totalQuizCount,
          userSubmittedQuizCount,
          userCorrectQuizCount,
          lectures: mappedLectures,
        };
      }),
    };

    return instanceToPlain(mappedData);
  }

  async findUserEnrollmentsById(userId: number) {
    const enrollments = await this.enrollmentRepository.find({
      where: { user: { userId } },
      relations: ['course'],
      select: { course: { courseId: true, title: true } },
    });

    for (const enrollment of enrollments) {
      const lectureCount = await this.lectureRepository.count({
        where: { course: { courseId: enrollment.course.courseId } },
      });
      enrollment.course['totalLectureLength'] = lectureCount;
    }

    return enrollments;
  }

  async findUserLectureDetail(userId: number, courseId: number) {
    const lectures = await this.lectureRepository.find({
      where: { course: { courseId } },
      relations: ['quizzes', 'quizzes.quizAnswers'],
    });

    const lectureDetails = await Promise.all(
      lectures.map(async (lecture) => {
        // Iterate through each quiz in the lecture
        const quizzes = await Promise.all(
          lecture.quizzes.map(async (quiz) => {
            // console.log('quiz', quiz);
            // Fetch quizSubmits separately based on userId and quizId
            const quizSubmits = await this.quizSubmitRepository.find({
              where: { user: { userId }, quiz: { quizId: quiz.quizId } },
              order: { quiz: { quizSubmits: { createdAt: 'DESC' } } },
            });

            // console.log('quizSubmits', quizSubmits);

            let lastSubmit = null;
            let answerType = '미채점';
            if (quizSubmits.length > 0) {
              lastSubmit = quizSubmits.reduce((latest, current) =>
                new Date(latest.createdAt) > new Date(current.createdAt)
                  ? latest
                  : current,
              );
              answerType =
                lastSubmit.status === 1
                  ? '정답'
                  : lastSubmit.status === 0
                    ? '미채점'
                    : '오답';
            }

            const submitCount = quizSubmits.length;
            const correctCount = quizSubmits.filter(
              (submit) => submit.status === 1,
            ).length;

            // console.log('last', lastSubmit);

            return {
              quizId: quiz.quizId,
              quizAnswers: quiz.quizAnswers,
              quizType: quiz.quizType,
              question: quiz.question,
              answer: !lastSubmit
                ? null
                : lastSubmit.multipleAnswer === 1
                  ? JSON.parse(lastSubmit.answer)
                  : lastSubmit.answer,
              submitCount: submitCount,
              correctCount: correctCount,
              answerType,
            };
          }),
        );

        const quizTotalCount = quizzes.length;
        const correctQuizCount = quizzes.filter(
          (quiz) => quiz.correctCount > 0,
        ).length;

        return {
          lectureNumber: lecture.lectureNumber,
          lectureId: lecture.lectureId,
          lectureTitle: lecture.title,
          quizzes: quizzes,
          quizTotalCount: quizTotalCount,
          correctQuizCount: correctQuizCount,
        };
      }),
    );

    return lectureDetails;
  }

  async updateDB(data: UpdateUserDto, userId: number) {
    const user = await this.usersRepository.findOne({
      where: {
        userId,
      },
    });
    if (data.email) {
      const isEmailExist = await this.usersRepository.findOne({
        where: {
          email: data.email,
        },
      });
      if (isEmailExist && user.email !== data.email) {
        throw new HttpException(
          '이메일이 유효하지 않습니다.',
          HttpStatus.CONFLICT,
        );
      }
    }

    try {
      const toSaveUser = this.usersRepository.create({
        ...user,
        ...data,
      });
      await this.usersRepository.update({ userId }, toSaveUser);
    } catch (err) {
      throw new Error(err);
    }

    return { message: 'Successfully update user info.' };
  }

  /** 코스 정보 */
  async findAll(): Promise<Course[]> {
    // 모든 코스를 가져옵니다.
    const courses = await this.courseRepository.find({
      relations: ['category'], // enrollments는 제외합니다.
    });

    // 각 코스별로 수강 인원 수와 퀴즈 타입별 갯수를 계산합니다.
    for (const course of courses) {
      // enrollmentRepository를 사용하여 각 코스의 수강 인원 수를 가져옵니다.
      const enrollmentCount = await this.enrollmentRepository.count({
        where: {
          course: { courseId: course.courseId },
        },
      });
      course['enrollmentCount'] = enrollmentCount;

      // 퀴즈 타입별 갯수를 계산합니다.
      const multipleChoiceCount = await this.quizRepository.count({
        where: {
          lecture: {
            courseId: course.courseId,
          },
          quizType: 'multiple',
        },
      });
      const descriptiveCount = await this.quizRepository.count({
        where: {
          lecture: {
            courseId: course.courseId,
          },
          quizType: 'descriptive',
        },
      });

      // 퀴즈 갯수를 새 속성에 할당합니다.
      course['multipleCount'] = multipleChoiceCount;
      course['descriptiveCount'] = descriptiveCount;
    }

    return courses;
  }

  async createCourse(createCourseDto: CreateCourseDto, filepath: string) {
    const newCourseData = this.courseRepository.create({
      thumbnailImagePath: filepath,
      category: {
        name: createCourseDto.curriculum,
      },
      ...createCourseDto,
    });

    await this.courseRepository.save(newCourseData);

    return { message: 'Success' };
  }

  async deleteCourses(deleteCourseDto: DeleteCourseDto) {
    const courseIds = deleteCourseDto.courseIds;
    try {
      const deleteResult = await this.courseRepository.delete({
        courseId: In(courseIds),
      });
      if (deleteResult.affected === 0) {
        throw new NotFoundException('존재하지 않는 코스입니다.');
      }
    } catch (error) {
      throw new NotFoundException('존재하지 않는 코스입니다.');
    }
  }

  async copyCourses(copyCourseDto: CopyCourseDto) {
    const courseIds = copyCourseDto.courseIds;
    try {
      const courses = await this.courseRepository.find({
        where: { courseId: In(courseIds) },
        relations: [
          'lectures',
          'lectures.quizzes',
          'lectures.quizzes.quizAnswers',
          'category',
        ],
      });

      if (courses.length === 0) {
        throw new NotFoundException('존재하지 않는 코스입니다.');
      }

      const newCourses = await Promise.all(
        courses.map(async (course) => {
          const newCourse = this.courseRepository.create({
            title: `복사본-${course.title}`,
            description: course.description,
            thumbnailImagePath: course.thumbnailImagePath,
            level: course.level,
            curriculum: course.curriculum,
            openDate: course.openDate,
            finishDate: course.finishDate,
            status: course.status,
            category: course.category,
          });

          const savedCourse = await this.courseRepository.save(newCourse);

          newCourse.lectures = await Promise.all(
            course.lectures.map(async (lecture) => {
              const newLecture = this.lectureRepository.create({
                course: savedCourse,
                title: lecture.title,
                lectureNumber: lecture.lectureNumber,
                videoLink: lecture.videoLink,
                attachmentFile: lecture.attachmentFile,
                // ... 나머지 속성들 추가
              });

              const savedLecture =
                await this.lectureRepository.save(newLecture);

              newLecture.quizzes = await Promise.all(
                lecture.quizzes.map(async (quiz) => {
                  const newQuiz = this.quizRepository.create({
                    quizType: quiz.quizType,
                    quizIndex: quiz.quizIndex,
                    question: quiz.question,
                    status: quiz.status,
                    lecture: savedLecture, // 복사된 lecture를 참조
                  });

                  const savedQuiz = await this.quizRepository.save(newQuiz);

                  newQuiz.quizAnswers = await Promise.all(
                    quiz.quizAnswers.map((quizAnswer) => {
                      return this.quizAnswerRepository.create({
                        itemIndex: quizAnswer.itemIndex,
                        item: quizAnswer.item,
                        isAnswer: quizAnswer.isAnswer,
                        status: quizAnswer.status,
                        quiz: savedQuiz, // 복사된 quiz를 참조
                      });
                    }),
                  );

                  await this.quizAnswerRepository.save(newQuiz.quizAnswers);

                  return savedQuiz;
                }),
              );

              return savedLecture;
            }),
          );

          return savedCourse;
        }),
      );

      return newCourses;
    } catch (error) {
      throw new NotFoundException('코스 복사 중 오류가 발생했습니다.');
    }
  }

  async findOne(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: {
        courseId,
      },
      relations: ['lectures', 'category'],
      order: {
        lectures: {
          lectureNumber: 'ASC', // Sort lectures by lectureNumber in ascending order
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  }

  async updateCourse(
    courseId: number,
    updateCourseDto: UpdateCourseDto,
    filepath: string | undefined,
  ) {
    const course = await this.courseRepository.findOne({
      where: {
        courseId,
      },
      relations: ['category'],
    });

    if (!course) {
      throw new Error('Course not found');
    }
    // console.log(updateCourseDto);

    course.courseId = courseId;
    course.title = updateCourseDto.title ?? course.title;
    course.status = updateCourseDto.status ?? course.status;
    course.level = updateCourseDto.level ?? course.level;
    course.description = updateCourseDto.description ?? course.description;
    // course.curriculum = updateCourseDto.curriculum ?? course.curriculum;
    course.category.name = updateCourseDto.curriculum ?? course.category.name;
    course.openDate = updateCourseDto.openDate ?? course.openDate;
    course.finishDate = updateCourseDto.finishDate ?? course.finishDate;
    if (filepath) {
      course.thumbnailImagePath = filepath;
    }
    // console.log(course);

    await this.courseRepository.update({ courseId }, course); // Save the course with all changes
  }

  async updateLectures(courseId: number, updateLecturesDto: UpdateLecturesDto) {
    const course = await this.courseRepository.findOne({
      where: {
        courseId,
      },
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
        // 이미 존재하는 강의인지
        lectureDto.lectureId &&
        existingLectureIds.includes(lectureDto.lectureId)
      ) {
        const lecture = course.lectures.find(
          (l) => l.lectureId === lectureDto.lectureId,
        );
        lecture.title = lectureDto.title;
        lecture.videoLink = lectureDto.videoLink;
        lecture.lectureNumber = lectureDto.lectureNumber;
        await this.lectureRepository.save(lecture);
      } else {
        // 새로 추가된 강의인지
        const newLecture = new Lecture();
        newLecture.courseId = courseId;
        newLecture.title = lectureDto.title;
        newLecture.videoLink = lectureDto.videoLink;
        newLecture.lectureNumber = lectureDto.lectureNumber;
        course.lectures.push(newLecture);
        await this.lectureRepository.save(newLecture);
      }
    }
    const lecturesToDelete = existingLectureIds.filter(
      (existingId) => !dtoLectureIds.includes(existingId),
    );

    if (lecturesToDelete.length > 0) {
      await this.lectureRepository.delete(lecturesToDelete);
    }
  }

  async getAllLectures(userId: number) {
    const courses = await this.courseRepository.find({
      relations: [
        'lectures',
        'lectures.quizzes',
        'lectures.quizzes.quizAnswers',
        'lectures.quizzes.quizSubmits',
        'lectures.lectureTimeRecords',
        'enrollments',
      ],
      where: {
        enrollments: { user: { userId } },
        lectures: {
          quizzes: { quizSubmits: { userId } },
          lectureTimeRecords: { userId },
        },
      },
      order: {
        lectures: { quizzes: { quizSubmits: { createdAt: 'DESC' } } },
      },
    });

    if (!courses.length) {
      return [];
    }

    return courses;
  }

  async findAllCurriculums() {
    const uniqueCurriculums = await this.courseRepository
      .createQueryBuilder('course')
      .select('DISTINCT(course.curriculum)', 'curriculum')
      .getRawMany();

    return uniqueCurriculums.map((entry) => entry.curriculum);
  }

  /**
   * 카테고리
   */
  async findAllCategories() {
    const categories = await this.categoryRepository.find({
      order: {
        order: 'ASC',
      },
    });
    return categories;
  }

  // 카테고리 정보를 수정하는 메서드
  async updateCategories(updateCategoriesDto: UpdateCategoryDto) {
    // 기존 카테고리 가져오기
    const existingCategories = await this.categoryRepository.find();
    const existingCategoryNames = existingCategories.map(
      (category) => category.name,
    );

    const dtoCategoryNames = updateCategoriesDto.categories.map(
      (dto) => dto.name,
    );

    for (const dto of updateCategoriesDto.categories) {
      const categoryDto = plainToInstance(CategoryDto, dto);

      if (
        // 이미 존재하는 카테고리인지
        categoryDto.name &&
        existingCategoryNames.includes(categoryDto.name)
      ) {
        const category = existingCategories.find(
          (c) => c.name === categoryDto.name,
        );
        category.name = categoryDto.name;
        category.order = categoryDto.order;
        await this.categoryRepository.save(category);
      } else {
        // 새로 추가된 카테고리인지
        const newCategory = new Category();
        newCategory.name = categoryDto.name;
        newCategory.order = categoryDto.order;
        await this.categoryRepository.save(newCategory);
      }
    }

    // 삭제할 카테고리 찾기
    const categoriesToDelete = existingCategoryNames.filter(
      (existingId) => !dtoCategoryNames.includes(existingId),
    );

    if (categoriesToDelete.length > 0) {
      await this.categoryRepository.delete(categoriesToDelete);
    }
  }

  /**
   * 퀴즈 정보
   */
  async findQuizAll({
    page,
    size,
    orderBy,
    name,
    position,
    departmentName,
    courseTitle,
    quizType,
    answerStatus,
    userDepartment,
    userLevel,
  }) {
    const statusMap = new Map([
      ['정답', 1],
      ['미채점', 0],
      ['오답', 2],
    ]);
    const statusCode = statusMap.get(answerStatus);

    const subquery = `
    SELECT MAX(qs.id) AS latestId
    FROM quiz_submit qs
    GROUP BY qs.userId, qs.quizId
  `;

    const latestQuizSubmissions = this.quizSubmitRepository
      .createQueryBuilder('quizSubmit')
      .innerJoin(`(${subquery})`, 'latest', 'quizSubmit.id = latest.latestId')
      .leftJoinAndSelect('quizSubmit.user', 'user')
      .leftJoinAndSelect('quizSubmit.quiz', 'quiz')
      .leftJoinAndSelect('quiz.lecture', 'lecture')
      .leftJoinAndSelect('lecture.course', 'course')
      .where('lecture.status = :status', { status: 'active' });

    if (userLevel === 'tutor' && userDepartment) {
      latestQuizSubmissions.andWhere('user.departmentName = :userDepartment', {
        userDepartment,
      });
    }

    // 필터링 조건
    if (statusCode !== undefined)
      latestQuizSubmissions.andWhere('quizSubmit.status = :statusCode', {
        statusCode,
      });
    if (name && name !== '')
      latestQuizSubmissions.andWhere('user.name LIKE :name', {
        name: `%${name}%`,
      });
    if (position && position !== '')
      latestQuizSubmissions.andWhere('user.position = :position', { position });
    if (departmentName && departmentName !== '')
      latestQuizSubmissions.andWhere('user.departmentName = :departmentName', {
        departmentName,
      });
    if (courseTitle && courseTitle !== '')
      latestQuizSubmissions.andWhere('course.title LIKE :courseTitle', {
        courseTitle: `%${courseTitle}%`,
      });
    if (quizType && quizType !== '')
      latestQuizSubmissions.andWhere('quizSubmit.multipleAnswer = :quizType', {
        quizType: quizType === '객관식' ? 1 : 0,
      });

    // if (answerStatus && answerStatus !== '') {
    //   console.log('hi', answerStatus);
    //   const statusMap = { 정답: 1, 미채점: 0, 오답: 2 };
    //   latestQuizSubmissions.andWhere('quizSubmit.status = :status', {
    //     status: statusMap[answerStatus],
    //   });
    //   console.log(statusMap[answerStatus]);
    // }
    // 정렬 조건
    latestQuizSubmissions.orderBy(
      'quizSubmit.createdAt',
      orderBy === 'newest' ? 'DESC' : 'ASC',
    );

    // 전체 개수 구하기
    const totalElements = await latestQuizSubmissions.getCount();

    // 페이지네이션 적용
    latestQuizSubmissions.skip((page - 1) * size).take(size);

    // 결과 가져오기
    const submittedQuiz = await latestQuizSubmissions.getMany();

    // 데이터를 매핑하여 응답 형식으로 변환
    const mappedData = submittedQuiz.map((sq) => {
      const departmentLabel =
        departments.find((dept) => dept.value === sq.user.departmentName)
          ?.label || 'N/A';
      const positionLabel =
        positions.find((pos) => pos.value === sq.user.position)?.label || 'N/A';

      return {
        id: sq.id,
        userId: sq.user.userId,
        quizId: sq.quiz.quizId,
        quizType: sq.multipleAnswer === 1 ? '객관식' : '주관식',
        name: sq.user.name,
        position: sq.user.position,
        positionLabel,
        departmentName: sq.user.departmentName,
        departmentLabel,
        lectureTitle: sq.quiz.lecture.title,
        courseTitle: sq.quiz.lecture.course.title,
        status: sq.status,
        answerType:
          sq.status === 1 ? '정답' : sq.status === 0 ? '미채점' : '오답',
      };
    });

    // 응답 형식으로 반환
    const totalPages = Math.ceil(totalElements / size);
    const currentPage = page;

    return {
      result: {
        currentPage,
        totalPages,
        totalElements,
        size,
        content: mappedData,
      },
    };
  }

  async feedbackQuiz(
    userId: number,
    quizId: number,
    feedbackdto: FeedbackDescriptiveQuiz,
  ) {
    try {
      const quizSubmitData = await this.quizSubmitRepository.findOne({
        where: {
          user: { userId },
          quiz: {
            quizId,
          },
        },
      });
      if (!quizSubmitData) {
        throw new NotFoundException(
          '사용자 퀴즈 제출 데이터를 찾을 수 없습니다.',
        );
      }

      const { feedbackComment, corrected } = feedbackdto;

      // 피드백과 채점 상태를 업데이트
      quizSubmitData.feedbackComment = feedbackComment;
      if (corrected) {
        quizSubmitData.status = 1;
      } else {
        quizSubmitData.status = 2;
      }

      await this.quizSubmitRepository.save(quizSubmitData);

      return { message: '피드백 전송에 성공했습니다.' };
    } catch (err) {
      throw new err();
    }
  }

  async getDescriptiveQuiz(userId: number, quizId: number) {
    const descriptiveQuiz = await this.quizSubmitRepository.findOne({
      where: {
        user: { userId },
        quiz: {
          quizId,
        },
      },
      relations: [
        'user',
        'quiz',
        'quiz.quizAnswers',
        'quiz.lecture',
        'quiz.lecture.course',
      ],
      order: {
        createdAt: 'DESC',
        quiz: { quizAnswers: { itemIndex: 'ASC' } },
      },
    });

    return instanceToPlain(descriptiveQuiz);
  }

  async getSubmittedQuizByUserId(userId: number) {
    const submissions = await this.quizSubmitRepository.find({
      relations: ['quiz', 'quiz.lecture', 'quiz.lecture.course'],
      where: {
        user: { userId },
        multipleAnswer: 1,
      },
      order: {
        quiz: { quizId: 'DESC' },
        createdAt: 'DESC',
      },
    });

    const latestSubmissions = submissions
      .reduce((acc, current) => {
        const quizId = current.quiz.quizId;
        if (!acc.has(quizId) || acc.get(quizId).createdAt < current.createdAt) {
          acc.set(quizId, current);
        }
        return acc;
      }, new Map())
      .values();

    // 과목 별 데이터 구조 생성
    const courseMap = new Map();
    for (const submission of latestSubmissions) {
      const course = submission.quiz.lecture.course;
      const lecture = submission.quiz.lecture;
      const quiz = submission.quiz;
      let courseData = courseMap.get(course.courseId);
      if (!courseData) {
        courseData = {
          courseTitle: course.title,
          lectures: new Map(),
          totalQuizzes: 0,
          correctQuizzes: 0,
        };
        courseMap.set(course.courseId, courseData);
        courseData;
      }
      let lectureData = courseData.lectures.get(lecture.lectureId);
      if (!lectureData) {
        lectureData = {
          lectureTitle: lecture.title,
          quizzes: [],
        };
        courseData.lectures.set(lecture.lectureId, lectureData);
      }
      lectureData.quizzes.push({
        question: quiz.question,
        isCorrect: submission.status === 1,
      });
      courseData.totalQuizzes += 1;
      if (submission.status === 1) {
        courseData.correctQuizzes += 1;
      }
    }

    // 과목 별 정답률을 계산하여 최종 결과 배열로 변환
    const result = Array.from(courseMap.values()).map(
      ({ courseTitle, lectures, totalQuizzes, correctQuizzes }) => ({
        courseTitle,
        lecture: Array.from(lectures.values()),
        correctRate:
          totalQuizzes > 0
            ? Math.round((correctQuizzes / totalQuizzes) * 100)
            : 0,
      }),
    );

    return result;
  }

  async createNewQuiz(lectureId: number, createNewQuiz: CreateQuizDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // 트랜잭션 시작
    await queryRunner.startTransaction();

    try {
      const findLastIndex = await this.quizRepository.findOne({
        where: { lecture: { lectureId } },
        order: { quizIndex: 'DESC' },
      });

      const { quizType, question } = createNewQuiz;

      const quizData = this.quizRepository.create({
        lecture: { lectureId },
        quizType: quizType,
        quizIndex: findLastIndex === null ? 1 : findLastIndex.quizIndex + 1,
        question: question,
      });

      const quizSaveResult = await this.quizRepository.save(quizData);

      if (quizType === 'multiple') {
        const answers = createNewQuiz.quizInfo.map((info) => {
          const quizAnswer = this.quizAnswerRepository.create({
            quizId: quizSaveResult.quizId,
            itemIndex: info.itemIndex,
            item: info.item,
            isAnswer: info.isAnswer,
          });
          return quizAnswer;
        });

        // 답변 엔티티들을 저장
        await this.quizAnswerRepository.save(answers);
      }

      await queryRunner.commitTransaction();

      return { message: '성공했습니다!' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async updateQuizData(quizId: number, updateQuizDto: CreateQuizDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // 트랜잭션 시작
    await queryRunner.startTransaction();

    const findQuizData = await this.quizRepository.findOne({
      where: { quizId: quizId },
      relations: ['quizAnswers'],
    });

    if (!findQuizData) {
      throw new NotFoundException('퀴즈 데이터를 찾을 수 없습니다.');
    }

    try {
      // 퀴즈 정보부터 저장
      await this.quizRepository.update(
        { quizId: quizId },
        {
          question: updateQuizDto.question ?? findQuizData.question,
          quizType: updateQuizDto.quizType ?? findQuizData.quizType,
        },
      );

      if (updateQuizDto.quizType === 'multiple') {
        // 기존 quizAnswers를 유지하면서 업데이트
        const existingAnswerMap = new Map(
          findQuizData.quizAnswers.map((answer) => [answer.itemIndex, answer]),
        );

        const maxExistingIndex = Math.max(...existingAnswerMap.keys());

        const updatedAnswers = [];
        for (
          let i = 1;
          i <= Math.max(updateQuizDto.quizInfo.length, maxExistingIndex);
          i++
        ) {
          const existingAnswer = existingAnswerMap.get(i);
          const updatedInfo = updateQuizDto.quizInfo.find(
            (info) => info.itemIndex === i,
          );

          if (existingAnswer && updatedInfo) {
            // 기존 답변 업데이트
            existingAnswer.item = updatedInfo.item;
            existingAnswer.isAnswer = updatedInfo.isAnswer;
            updatedAnswers.push(existingAnswer);
          } else if (existingAnswer) {
            // 기존 답변이 있지만 업데이트된 정보가 없으면 삭제
            await this.quizAnswerRepository.remove(existingAnswer);
          } else if (updatedInfo) {
            // 새로운 답변 생성
            const quizAnswer = this.quizAnswerRepository.create({
              quizId: quizId,
              itemIndex: updatedInfo.itemIndex,
              item: updatedInfo.item,
              isAnswer: updatedInfo.isAnswer,
            });
            updatedAnswers.push(quizAnswer);
          }
        }

        findQuizData.quizAnswers = updatedAnswers;
        await this.quizAnswerRepository.save(updatedAnswers);
        await queryRunner.commitTransaction();

        return { message: '퀴즈 수정이 완료되었습니다!' };
      } else {
        await this.quizAnswerRepository.remove(findQuizData.quizAnswers);
        await queryRunner.commitTransaction();
        return { message: '퀴즈 수정이 완료되었습니다!' };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new error();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteQuiz(quizId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // 트랜잭션 시작
    await queryRunner.startTransaction();

    try {
      await this.quizRepository.delete({
        quizId: quizId,
      });
      await queryRunner.commitTransaction();
      return { message: '성공적으로 삭제했습니다!' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new error();
    } finally {
      await queryRunner.release();
    }
  }

  async feedbackToUserAnswer(quizId: number, userId: number, dto: FeedbackDto) {
    await this.quizSubmitRepository.update(
      {
        quiz: { quizId },
        userId,
      },
      {
        feedbackComment: dto.feedbackComment,
        status: dto.isAnswer,
      },
    );
  }
}
