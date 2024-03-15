import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizzesService } from './quizzes.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  async createQuizzes(@Body() createQuizDtos: CreateQuizDto[]) {
    await this.quizzesService.createQuizzes(createQuizDtos);
    return { message: 'Quizzes created successfully' };
  }

  @Public()
  @Get(':courseId')
  findAll(
    @Param('courseId') courseId: number,
    @Query('userId') userId: number,
  ) {
    return this.quizzesService.findAllByCourseId(courseId, userId);
  }
}
