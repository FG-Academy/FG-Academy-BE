import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthUser } from '../users/decorators/user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getMyDashboard(@AuthUser('userId') userId: number) {
    return this.dashboardService.findAll(userId);
  }

  // 여기에서 role 규칙을 추가해서, 관리자 계정이면 Params에서 userId를 가져오고,
  //아니면 AuthUser에서 userId를 가져오게 하는 방식으로 할까?
  @Get('/quizzes')
  getMyQuizList(@AuthUser('userId') userId: number) {
    return this.dashboardService.findQuizList(userId);
  }
}
