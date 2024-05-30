import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QnaService } from './qna.service';
import { Roles } from '../users/decorators/role.decorator';
import { CreateQuestoinDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AuthUser } from '../users/decorators/user.decorator';
import { CreateAnswerDto } from './dto/create-answr.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';

@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  // * * 1. 질문 게시글 올리는 API
  @Post()
  async createQuestion(
    @AuthUser('userId') userId: number,
    @Body() createQuestionDto: CreateQuestoinDto,
  ) {
    return this.qnaService.createQuestionPost(userId, createQuestionDto);
  }

  // * * 2. 질문 게시글 수정하는 API
  @Patch()
  async updateQuestion(
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Query('questionId') questionId: number,
  ) {
    return this.qnaService.updateQuestionPost(updateQuestionDto, questionId);
  }

  // * * 3. 질문 게시글 삭제하는 API
  //! 글 작성자와 매니저가 삭제할 수 있는 권한이 있어야함.
  @Delete()
  async deleteQuestion(@Query('questionId') questionId: number) {
    return this.qnaService.deleteQuestionPost(questionId);
  }

  // * * 4. 질문 게시글 리스트를 조회하는 API
  @Get()
  findQuestion(@Query('page') pageNum: string) {
    const pageNumber = parseInt(pageNum, 10) || 1;
    return this.qnaService.findQuestion(pageNumber);
  }

  // * * 5. 답변 댓글을 등록할 수 있는 API
  @Roles('admin', 'manager') //? 이건 근데 매니저만 하게 하면 되나? 또 추가질문이 있을 수도 있는데 굳이?
  @Post('answers')
  async createAnswer(
    @AuthUser('userId') userId: number,
    @Body() createAnswerDto: CreateAnswerDto,
    @Query('questionId') questionId: number,
  ) {
    console.log(questionId);
    return this.qnaService.createAnswerPost(
      userId,
      createAnswerDto,
      questionId,
    );
  }

  // * * 6. 답변 댓글을 수정할 수 있는 API
  @Patch('answers')
  async updateAnswers(
    @AuthUser('userId') userId: number,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @Query('answerId') answerId: number,
  ) {
    return this.qnaService.updateAnswerPost(userId, updateAnswerDto, answerId);
  }

  // * * 7. 답변 댓글을 삭제할 수 있는 API
  //! 글 작성자와 매니저가 삭제할 수 있는 권한이 있어야함.
  @Delete('answers')
  async deleteAnswers(@AuthUser() user, @Query('answerId') answerId: number) {
    const userId = user.userId;

    const level = user.level;
    await this.qnaService.deleteAnswerPost(userId, answerId, level);

    return { message: '삭제에 성공했습니다.' };
  }

  // * * 8. 특정 질문 게시글 1개의 내용을 조회하는 API
  @Get('posts')
  async findQuestionAnswer(
    @AuthUser() user,
    @Query('questionId') questionId: number,
  ) {
    console.log(user);
    return this.qnaService.findQuestionAnswerPost(questionId);
  }
}
