import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from 'src/entities/quiz.entity';
import { QuizSubmit } from 'src/entities/quizSubmit.entity';
import { CreateQuizAnswerDto } from './dto/create-quizAnswer.dto';
import { QuizAnswer } from 'src/entities/quizAnswer.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(QuizSubmit)
    private readonly quizSubmitRepository: Repository<QuizSubmit>,
    @InjectRepository(QuizAnswer)
    private readonly quizAnswerRepository: Repository<QuizAnswer>,
  ) {}

  async findAllLectureQuiz(lectureId: number, userId: number): Promise<Quiz[]> {
    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.quizAnswers', 'quizAnswer')
      .leftJoinAndSelect(
        'quiz.quizSubmits',
        'quizSubmit',
        'quizSubmit.userId = :userId',
        { userId },
      )
      .where('quiz.lectureId = :lectureId', { lectureId })
      .orderBy('quiz.quizId', 'ASC')
      .addOrderBy('quizAnswer.id', 'ASC')
      .getMany();
    console.log(quizzes);

    return quizzes;
  }

  async saveUserAnswer(userId: number, data: CreateQuizAnswerDto) {
    const multipleQuiz = await this.quizSubmitRepository.find({
      where: {
        user: { userId: userId }, // userId를 사용하여 user 엔티티와 매칭
        quiz: { quizId: data.quizId }, // quizId를 사용하여 quiz 엔티티와 매칭
        multipleAnswer: 1,
      },
    });
    const isFinished = multipleQuiz.some(
      (submission) => submission.status === 1,
    );
    if (multipleQuiz.length >= 3) {
      throw new HttpException(
        '더 이상 퀴즈를 제출할 수 없습니다.',
        HttpStatus.BAD_REQUEST,
      );
    } else if (isFinished) {
      throw new HttpException(
        '이미 정답으로 처리된 문제가 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const descriptiveQuiz = await this.quizSubmitRepository.findOne({
      where: {
        user: { userId: userId }, // userId를 사용하여 user 엔티티와 매칭
        quiz: { quizId: data.quizId }, // quizId를 사용하여 quiz 엔티티와 매칭
        multipleAnswer: 0,
      },
    });
    if (descriptiveQuiz) {
      if (descriptiveQuiz.status === 0) {
        throw new HttpException(
          '아직 채점이 완료되지 않았습니다.',
          HttpStatus.BAD_REQUEST,
        );
      } else if (descriptiveQuiz.status === 1) {
        throw new HttpException(
          '이미 정답 처리 된 문제입니다.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      if (data.multipleAnswer) {
        const quizAnswers = await this.quizAnswerRepository.find({
          where: {
            quiz: { quizId: data.quizId },
            isAnswer: true,
          },
        });
        const correctAnswers = quizAnswers.map((answer) => answer.itemIndex);

        // 사용자가 제출한 답안 파싱
        const submittedAnswers = JSON.parse(data.answer);

        // 정답 일치 검사
        const isCorrect =
          correctAnswers.sort().toString() ===
          submittedAnswers.sort().toString();

        const quizSubmit = this.quizSubmitRepository.create({
          user: { userId },
          quiz: { quizId: data.quizId },
          multipleAnswer: 1,
          answer: data.answer,
          status: isCorrect ? 1 : 2, // 정답이면 1, 오답이면 2로 상태 설정
        });
        await this.quizSubmitRepository.save(quizSubmit);
      } else if (!descriptiveQuiz) {
        const descriptiveAnswer = this.quizSubmitRepository.create({
          user: { userId },
          quiz: { quizId: data.quizId },
          multipleAnswer: 0,
          answer: data.answer,
          status: 0,
        });
        await this.quizSubmitRepository.save(descriptiveAnswer);
      } else {
        await this.quizSubmitRepository.update(
          {
            user: { userId },
            quiz: { quizId: data.quizId },
          },
          {
            status: 0,
            answer: data.answer,
          },
        );
      }
      return { message: '퀴즈가 성공적으로 제출되었습니다.' };
    } catch (error) {
      throw error;
    }
  }
}
