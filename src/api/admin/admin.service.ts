import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  Injectable,
  NotFoundException,
  // NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/entities/course.entity';
import { Lecture } from 'src/entities/lecture.entity';
import { LectureDto, UpdateCourseDto } from './dto/update-course.dto';
import { Announcement } from 'src/entities/announcement.entity';
import { Enrollment } from 'src/entities/enrollment.entity';
import { LectureTimeRecord } from 'src/entities/lectureTimeRecord.entity';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizAnswer } from 'src/entities/quizAnswer.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { User } from 'src/entities/user.entity';
import { UpdateLecturesDto } from './dto/update-lectures.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';
import { DataSource, FindOneOptions, Repository, In } from 'typeorm';
import { FeedbackDescriptiveQuiz } from './dto/feedbackDescriptiveQuiz.dto';
import { CreateQuizDto } from './dto/create-new-quiz.dto';
import { FeedbackDto } from './dto/feedback.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
    @InjectRepository(LectureTimeRecord)
    private lectureTimeRecordRepository: Repository<LectureTimeRecord>, // UserRepository 주입
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
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async findAllUsers() {
    const user = await this.usersRepository.find({
      relations: ['enrollments'],
    });

    return instanceToPlain(user);
  }

  async findUserById(userId: number) {
    const user = await this.usersRepository.findOne({
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

  async findOneByUserId(where: FindOneOptions<User>) {
    const user = await this.usersRepository.findOne(where);

    if (!user) {
      throw new NotFoundException(
        `There isn't any user with identifier: ${where}`,
      );
    }

    return instanceToPlain(user);
  }

  async findQuizAll2() {
    const submittedQuiz = await this.quizSubmitRepository.find({
      relations: ['user', 'quiz', 'quiz.lecture', 'quiz.lecture.course'],
      where: { multipleAnswer: 0 },
    });
    // 데이터를 원하는 형식으로 매핑
    const mappedData = submittedQuiz.map((sq) => ({
      id: sq.id,
      userId: sq.user.userId,
      quizId: sq.quiz.quizId,
      name: sq.user.name,
      position: sq.user.position,
      departmentName: sq.user.departmentName,
      lectureTitle: sq.quiz.lecture.title,
      courseTitle: sq.quiz.lecture.course.title,
      status: sq.status,
      user: sq.user,
      quiz: sq.quiz,
    }));

    return instanceToPlain(mappedData);
  }

  async getDescriptiveQuiz(userId: number, quizId: number) {
    const descriptiveQuiz = await this.quizSubmitRepository.findOne({
      where: { multipleAnswer: 0, user: { userId }, quiz: { quizId } },
      relations: ['user', 'quiz', 'quiz.lecture', 'quiz.lecture.course'],
    });

    // 데이터를 원하는 형식으로 매핑
    // const mappedData = descriptiveQuiz.map((dq) => ({
    //   id: dq.id,
    //   userId: dq.userId,
    //   multipleAnswer: dq.multipleAnswer,
    //   answer: dq.answer,
    //   submittedAnswer: dq.submittedAnswer,
    //   feedbackComment: dq.feedbackComment,
    //   status: dq.status,
    //   user: dq.user,
    // }));
    console.log(descriptiveQuiz);
    return instanceToPlain(descriptiveQuiz);
  }

  async findQuizAll() {
    // 모든 퀴즈 제출 정보와 연관된 데이터를 함께 조회합니다.
    const quizSubmissions = await this.quizSubmitRepository.find({
      relations: [
        'user',
        'quiz',
        'quiz.lecture',
        'quiz.lecture.course',
        'quiz.quizAnswers',
      ],
      order: {
        userId: 'ASC', // 정렬을 확실하게 하기 위해 추가
      },
    });

    const groupedResults = {};

    // 퀴즈 제출을 사용자별로 그룹화
    quizSubmissions.forEach((submission) => {
      const userId = submission.user.userId;
      const quizId = submission.quiz.quizId;

      // console.log(submission);

      // 해당 사용자와 퀴즈 ID를 기준으로 그룹이 아직 없으면 초기화
      const userQuizKey = `${userId}-${quizId}`;
      if (!groupedResults[userQuizKey]) {
        groupedResults[userQuizKey] = {
          userId: userId,
          name: submission.user.name,
          department: submission.user.departmentName,
          position: submission.user.position,
          level: submission.user.level,
          quizId: quizId, // 추가된 quizId
          courseTitle: submission.quiz.lecture.course.title,
          lectureTitle: submission.quiz.lecture.title,
          quizTitle: submission.quiz.question,
          quizType: submission.quiz.quizType,
          submittedAnswers: [],
          answerNumbers: submission.quiz.quizAnswers
            .filter((a) => a.isAnswer)
            .map((a) => a.itemIndex),
          answerContents: submission.quiz.quizAnswers
            .filter((a) => a.isAnswer)
            .map((a) => a.item),
          quizContents: [],
          corrected: true,
          feedback: submission.feedbackComment,
          submittedDate: submission.createdAt,
          status: submission.status,
        };
      }

      // 문항 내용과 제출한 답안 추가
      if (submission.quiz.quizType === 'multiple') {
        groupedResults[userQuizKey].submittedAnswers.push(
          submission.multipleAnswer,
        );
        const answerDetail = submission.quiz.quizAnswers.find(
          (a) => a.itemIndex === submission.multipleAnswer,
        );
        if (answerDetail) {
          groupedResults[userQuizKey].quizContents.push(answerDetail.item);
        }
      } else {
        groupedResults[userQuizKey].submittedAnswer =
          submission.submittedAnswer;
      }
    });

    // 정답 체크 로직을 사용자의 각 제출마다 적용
    Object.keys(groupedResults).forEach((key) => {
      const quiz = groupedResults[key];

      // console.log(quiz.status);
      if (quiz.quizType === 'multiple') {
        quiz.corrected =
          quiz.submittedAnswers.sort((a, b) => a - b).join(',') ===
          quiz.answerNumbers.sort((a, b) => a - b).join(',');
      } else if (quiz.quizType !== 'multiple') {
        if (quiz.status === 0) quiz.corrected = null;
        else if (quiz.status === 1) quiz.corrected = true;
        else if (quiz.status === 2) quiz.corrected = false;
      }
    });

    // 데이터 구조를 최종 사용자별로 재구성
    const finalResults = {};
    Object.values(groupedResults).forEach((quiz: any) => {
      if (!finalResults[quiz.userId]) {
        finalResults[quiz.userId] = {
          userId: quiz.userId,
          name: quiz.name,
          department: quiz.department,
          position: quiz.position,
          level: quiz.level,
          quizzes: [],
          totalSubmissions: 0,
          correctSubmissions: 0,
        };
      }

      finalResults[quiz.userId].quizzes.push({
        quizId: quiz.quizId,
        courseTitle: quiz.courseTitle,
        lectureTitle: quiz.lectureTitle,
        quizTitle: quiz.quizTitle,
        quizContents: quiz.quizContents,
        quizType: quiz.quizType,
        submittedAnswer: quiz.submittedAnswer,
        answer: quiz.answerNumbers,
        answerContent: quiz.answerContents.join(', '),
        corrected: quiz.corrected,
        feedback: quiz.feedback,
        submittedDate: quiz.submittedDate,
      });
      if (quiz.quizType === 'multiple')
        finalResults[quiz.userId].totalSubmissions++;
      if (quiz.corrected) {
        finalResults[quiz.userId].correctSubmissions++;
      }
    });

    // 각 사용자별로 정답률 계산
    return Object.values(finalResults).map((userResult: any) => {
      userResult.correctedRate = (
        (userResult.correctSubmissions / userResult.totalSubmissions) *
        100
      ).toFixed(2);
      return userResult;
    });
  }

  async updateCourse(
    courseId: number,
    updateCourseDto: UpdateCourseDto,
    filepath: string,
  ) {
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
      where: { enrollments: { user: { userId } } },
    });

    if (!courses.length) {
      return [];
    }

    // 모든 코스를 순회하며 각 렉처의 모든 관련 데이터를 userId에 맞게 필터링
    courses.forEach((course) => {
      course.lectures.forEach((lecture) => {
        // 각 퀴즈의 quizSubmits 필터링
        lecture.quizzes.forEach((quiz) => {
          quiz.quizSubmits = quiz.quizSubmits.filter((quizSubmit) => {
            return quizSubmit.userId === userId;
          });
        });
        // 각 렉처의 lectureTimeRecords 필터링
        lecture.lectureTimeRecords = lecture.lectureTimeRecords.filter(
          (record) => {
            return record.userId === userId;
          },
        );
      });
    });

    return courses;
  }

  async findMultipleQuizList(userId: number, queryQuizType: string) {
    // 사용자가 제출한 모든 퀴즈 정보와 그 답안들을 조회합니다.
    const submittedQuizzes = await this.quizSubmitRepository
      .createQueryBuilder('quizSubmit')
      .leftJoinAndSelect('quizSubmit.quiz', 'quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect('quiz.lecture', 'lecture')
      .leftJoinAndSelect('lecture.course', 'course') // 강의가 속한 코스를 추가로 불러옵니다.
      .where('quizSubmit.userId = :userId', { userId })
      .andWhere(`quiz.quizType = '${queryQuizType}'`)
      .getMany();

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
          feedback: submit.feedbackComment,
        });
      }
      const quizEntry = quizMap.get(quizId);

      if (queryQuizType === 'descriptive') {
        quizEntry.submittedAnswer.push(submit.submittedAnswer);
      } else {
        quizEntry.submittedAnswer.push(submit.multipleAnswer);
      }

      quizEntry.submittedAnswersContents.push(
        submit.quiz.quizAnswers.find(
          (answer) => answer.itemIndex === submit.multipleAnswer,
        )?.item || '답안 없음',
      );
      // 모든 제출된 답안이 정답인지 확인하여 하나라도 틀리면 isAnswer를 false로 설정합니다.
      if (
        !submit.quiz.quizAnswers.every(
          (answer) =>
            answer.isAnswer && answer.itemIndex === submit.multipleAnswer,
        )
      ) {
        quizEntry.isAnswer = false;
      }

      // 주관식일 경우 미채점=null, 정답체크=true, 오답체크=false
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

  async getSubmittedQuizByUserId(userId: number, queryQuizType: string) {
    // 사용자가 제출한 퀴즈 중 multipleAnswer가 1인 것만 가져오고, 같은 quizId에 대해 최신 제출만 유지
    const submissions = await this.quizSubmitRepository
      .createQueryBuilder('quizSubmit')
      .leftJoinAndSelect('quizSubmit.quiz', 'quiz')
      .leftJoinAndSelect('quiz.lecture', 'lecture')
      .leftJoinAndSelect('lecture.course', 'course')
      .where('quizSubmit.userId = :userId', { userId })
      .andWhere('quizSubmit.multipleAnswer = 1')
      .orderBy('quizSubmit.quizId', 'DESC')
      .addOrderBy('quizSubmit.createdAt', 'DESC')
      .getMany();
    console.log(queryQuizType);

    const latestSubmissions = submissions
      .reduce((acc, current) => {
        const quizId = current.quiz.quizId;
        if (!acc.has(quizId) || acc.get(quizId).createdAt < current.createdAt) {
          acc.set(quizId, current);
        }
        return acc;
      }, new Map())
      .values();
    console.log(latestSubmissions);

    // 과목 별 데이터 구조 생성
    const courseMap = new Map();
    for (const submission of latestSubmissions) {
      console.log(submission);
      // const { course, lecture, quiz } = submission.quiz.lecture;
      const course = submission.quiz.lecture.course;
      const lecture = submission.quiz.lecture;
      const quiz = submission.quiz;
      let courseData = courseMap.get(course.courseId);
      console.log(courseData);
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

  async feedbackQuiz(
    userId: number,
    quizId: number,
    feedbackdto: FeedbackDescriptiveQuiz,
  ) {
    try {
      const quizSubmitData = await this.quizSubmitRepository.findOne({
        where: { user: { userId }, quiz: { quizId } },
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
      throw new err();
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

  async updateQuizData(
    lectureId: number,
    quizId: number,
    updateQuizDto: CreateQuizDto,
  ) {
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
        console.log(existingAnswerMap);
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
