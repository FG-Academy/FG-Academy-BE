import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';
// import { Public } from '../auth/decorators/public.decorator';
import { CreateQuizAnswerDto } from './dto/create-quizAnswr.dto';
import { AuthUser } from '../users/decorators/user.decorators';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  async createQuizzes(@Body() createQuizDtos: CreateQuizDto[]) {
    await this.quizzesService.createQuizzes(createQuizDtos);
    return { message: 'Quizzes created successfully' };
  }

  // @Public()
  @Get(':courseId')
  findAll(
    @Param('courseId') courseId: number,
    @AuthUser() user,
    // @Query('userId') userId: number,
  ) {
    const userId = user.userId;
    return this.quizzesService.findAllByCourseId(courseId, userId);
  }

  // @Public()
  @Get(':courseId/:lectureId')
  findGetQuiz(
    @Param('courseId') courseId: number,
    @Param('lectureId') lectureId: number,
    @AuthUser() user,
  ) {
    const userId = user.userId;
    return this.quizzesService.findAllLectureQuiz(courseId, lectureId, userId);
  }

  @Post(':courseId/:lectureId')
  saveUserQuizAnswer(
    @Param('courseId') courseId: number,
    @Param('lectureId') lectureId: number,
    @AuthUser() user,
    @Body() data: CreateQuizAnswerDto,
  ) {
    const userId = user.userId;

    return this.quizzesService.saveUserAnswer(
      courseId,
      lectureId,
      userId,
      data,
    );
  }
}
