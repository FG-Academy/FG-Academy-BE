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
  ) {}

  /** 유저 정보 */
  async findAllUsers() {
    const users = await this.usersRepository.find();
    const usersForResponse = users.map((user) => instanceToPlain(user));
    return usersForResponse;
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
        'enrollments.course.lectures.lectureTimeRecords',
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
      ...user,
      password: null,
      refreshToken: null,
      enrollments: filteredEnrollments.map((enrollment) => {
        const lectures = enrollment.course.lectures || [];
        let totalQuizCount = 0;
        let userSubmittedQuizCount = 0;
        let userCorrectQuizCount = 0;
        let completedLecturesCount = 0;

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

          const hasCompletedLecture = lecture.lectureTimeRecords.some(
            (record) => record.userId === userId && record.status === true,
          );

          if (hasCompletedLecture) {
            completedLecturesCount++;
          }

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
        // console.log(totalQuizCount);
        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.course.courseId,
          courseTitle: enrollment.course.title,
          totalLecturesCount,
          completedLecturesCount,
          totalQuizCount: totalQuizCount,
          userSubmittedQuizCount,
          userCorrectQuizCount,
          lectures: mappedLectures,
        };
      }),
    };

    return instanceToPlain(mappedData);
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
      relations: ['enrollments'],
    });

    // 각 코스별로 수강 인원 수를 계산합니다.
    for (const course of courses) {
      // enrollments 관계를 통해 수강 인원 수를 세고 새 속성에 할당합니다.
      course['enrollmentCount'] = course.enrollments.length;

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

  async findOne(courseId: number) {
    const course = await this.courseRepository.findOne({
      where: {
        courseId,
      },
      relations: ['lectures'],
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
    });

    if (!course) {
      throw new Error('Course not found');
    }

    course.courseId = courseId;
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
   * 퀴즈 정보
   */
  async findQuizAll() {
    const submittedQuiz = await this.quizSubmitRepository.find({
      relations: ['user', 'quiz', 'quiz.lecture', 'quiz.lecture.course'],
      where: {
        quiz: {
          lecture: {
            status: 'active',
          },
        },
      },
    });

    // 유저별 동일한 quizId에 대해 가장 최근의 제출만 추적
    const latestQuizMap = new Map();

    submittedQuiz.forEach((sq) => {
      const key = `${sq.user.userId}-${sq.quiz.quizId}`;
      if (
        !latestQuizMap.has(key) ||
        latestQuizMap.get(key).createdAt < sq.createdAt
      ) {
        latestQuizMap.set(key, sq);
      }
    });

    // 최신 퀴즈만 포함된 배열로 변환
    const latestQuizzes = Array.from(latestQuizMap.values());

    // 데이터를 원하는 형식으로 매핑
    const mappedData = latestQuizzes.map((sq) => {
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

    return instanceToPlain(mappedData);
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
