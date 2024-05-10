import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';
import { CreateQuizAnswerDto } from './dto/create-quizAnswer.dto';
import { AuthUser } from '../users/decorators/user.decorator';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  async createQuizzes(@Body() createQuizDtos: CreateQuizDto[]) {
    await this.quizzesService.createQuizzes(createQuizDtos);
    return { message: 'Quizzes created successfully' };
  }

  @Get(':courseId')
  findAll(
    @Param('courseId') courseId: number,
    @AuthUser() user,
    // @Query('userId') userId: number,
  ) {
    const userId = user.userId;
    return this.quizzesService.findAllByCourseId(courseId, userId);
  }

  @Get(':courseId/:lectureId')
  findGetQuiz(
    @Param('courseId') courseId: number,
    @Param('lectureId') lectureId: number,
    @AuthUser('userId') userId,
  ) {
    return this.quizzesService.findAllLectureQuiz(courseId, lectureId, userId);
  }

  @Post('answer')
  saveUserQuizAnswer(
    @AuthUser('userId') userId: number,
    @Body() data: CreateQuizAnswerDto,
  ) {
    return this.quizzesService.saveUserAnswer(userId, data);
  }
}
