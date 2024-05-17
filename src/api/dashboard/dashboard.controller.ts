import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthUser } from '../users/decorators/user.decorator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: '[내 강의실] 모든 코스를 가져옴' })
  @Get()
  getMyDashboard(@AuthUser('userId') userId: number) {
    return this.dashboardService.findAll(userId);
  }

  @Get('/quizzes')
  getMyQuizList(@AuthUser('userId') userId: number) {
    return this.dashboardService.findQuizList(userId);
  }
}
