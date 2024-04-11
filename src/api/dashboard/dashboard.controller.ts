import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthUser } from '../users/decorators/user.decorators';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getMyDashboard(@AuthUser('userId') userId: number) {
    return this.dashboardService.findAll(userId);
  }

  @Get('/quizzes')
  getMyQuizList(@AuthUser('userId') userId: number) {
    return this.dashboardService.findQuizList(userId);
  }
}
