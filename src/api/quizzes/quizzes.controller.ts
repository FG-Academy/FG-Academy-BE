import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizAnswerDto } from './dto/create-quizAnswer.dto';
import { AuthUser } from '../users/decorators/user.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @ApiOperation({
    summary: '[관리자 화면 | 강의 수강 화면] 강의 별 퀴즈 가져오기',
  })
  @Get('lectures/:lectureId')
  findGetQuiz(
    @Param('lectureId') lectureId: number,
    @AuthUser('userId') userId: number,
  ) {
    return this.quizzesService.findAllLectureQuiz(lectureId, userId);
  }

  @Post('answer')
  saveUserQuizAnswer(
    @AuthUser('userId') userId: number,
    @Body() data: CreateQuizAnswerDto,
  ) {
    return this.quizzesService.saveUserAnswer(userId, data);
  }
}
