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

  // /api/v1/quizzes/me/courses
  @ApiOperation({
    summary: '[내 강의 | 퀴즈] 강의 목록 가져오기',
  })
  @Get('me/courses')
  findMyCourses(@AuthUser('userId') userId: number) {
    return this.quizzesService.findMyCoursesByQuiz(userId);
  }

  @ApiOperation({
    summary: '[내 강의] 강의 별 내 퀴즈 가져오기',
  })
  @Get('me/courses/:courseId')
  findMyQuizzes(
    @AuthUser('userId') userId: number,
    @Param('courseId') courseId: number,
  ) {
    return this.quizzesService.findMyQuizzes(userId, courseId);
  }

  @ApiOperation({
    summary: '[관리자 화면 | 강의 수강 화면] 퀴즈 조회',
  })
  @Get('/:quizId')
  findGetQuizById(
    @Param('quizId') quizId: number,
    @AuthUser('userId') userId: number,
  ) {
    return this.quizzesService.findQuizById(quizId, userId);
  }

  @Post('answer')
  saveUserQuizAnswer(
    @AuthUser('userId') userId: number,
    @Body() data: CreateQuizAnswerDto,
  ) {
    return this.quizzesService.saveUserAnswer(userId, data);
  }
}
