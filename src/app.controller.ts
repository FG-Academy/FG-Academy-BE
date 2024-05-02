import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './api/auth/auth.service';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get('/oauth')
  async getKakaoInfo(@Query() query: { code }) {
    await this.authService.kakaoLogin(query.code);
  }
}
