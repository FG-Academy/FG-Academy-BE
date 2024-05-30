import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Answer } from 'src/entities/answer.entity';
import { Question } from 'src/entities/question.entity';
import { Repository } from 'typeorm';
import { CreateAnswerDto } from './dto/create-answr.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answertRepository: Repository<Answer>,
  ) {}

  createQuestionPost(userId, createQuestionDto) {
    const newQuestion = this.questionRepository.create({
      user: userId,
      ...createQuestionDto,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const saveQuestion = this.questionRepository.save(newQuestion);
    } catch (err) {
      throw err;
    }

    return { message: '게시글이 성공적으로 업로드되었습니다.' };
  }

  async deleteQuestionPost(questionId: number) {
    try {
      const result = await this.questionRepository.delete({
        questionId: questionId,
      });

      console.log(result);
    } catch (err) {
      throw err;
    }
    return { message: '게시글이 성공적으로 삭제되었습니다..' };
  }

  async updateQuestionPost(
    updateQuestionDto: UpdateQuestionDto,
    questionId: number,
  ) {
    const { title, content } = updateQuestionDto;
    const post = await this.questionRepository.findOne({
      where: { questionId },
    });
    if (!post) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }
    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }
    return this.questionRepository.save(post);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findQuestion(pageNum) {
    const itemsPerPage = 10;
    const [list, total] = await this.questionRepository.findAndCount({
      skip: (pageNum - 1) * itemsPerPage,
      take: itemsPerPage,
      order: { createdAt: 'DESC' },
    });
    const totalPages = Math.ceil(total / itemsPerPage);
    return { message: '성공적으로 로드했습니다.', list, totalPages };
  }

  async createAnswerPost(
    userId: number,
    createAnswerDto: CreateAnswerDto,
    questionId: number,
  ) {
    const question = await this.questionRepository.findOne({
      where: { questionId: questionId },
    });

    if (!question) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }

    const newAnswer = this.answertRepository.create({
      user: { userId: userId },
      question: question,
      content: createAnswerDto.content,
    });

    try {
      await this.answertRepository.save(newAnswer);
    } catch (err) {
      throw err;
    }

    return { message: '답변 댓글이 성공적으로 업로드되었습니다.' };
  }

  async updateAnswerPost(
    userId: number,
    updateAnswerDto: UpdateAnswerDto,
    answerId: number,
  ) {
    const { content } = updateAnswerDto;
    const existAnswer = await this.answertRepository.findOne({
      where: { user: { userId: userId }, answerId: answerId },
    });

    if (!existAnswer)
      throw new Error('해당 답변이 존재하지 않거나, 수정 권한이 없습니다.');

    if (content) existAnswer.content = content;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updateAnswer = await this.answertRepository.save(existAnswer);
      return { message: '성공적으로 수정했습니다. ' };
    } catch (err) {
      throw err;
    }
  }

  async deleteAnswerPost(userId: number, answerId: number, level: string) {
    const existAnswer = await this.answertRepository.findOne({
      where: { answerId },
      relations: ['user'],
    });

    if (!existAnswer)
      throw new NotFoundException('삭제되었거나 존재하지 않는 답변입니다');

    if (
      existAnswer.user.userId === userId ||
      level === 'manager' ||
      level === 'admin'
    ) {
      await this.answertRepository.delete({
        answerId,
      });
    } else {
      throw new Error('삭제할 권한이 없습니다.');
    }
  }

  async findQuestionAnswerPost(questionId: number) {
    console.log(questionId);
    const questionWithAnswers = await this.questionRepository.findOne({
      where: { questionId: questionId },
      relations: ['answers', 'answers.user', 'user'],
    });
    console.log(questionWithAnswers);
    if (!questionWithAnswers) {
      throw new Error('삭제되었거나 존재하지 않는 게시글입니다.');
    }

    return questionWithAnswers;
  }
}
