import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './api/auth/auth.service';
import * as bcrypt from 'bcrypt';
import { Public } from './api/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Get('/oauth')
  async getKakaoInfo(@Query() query: { code }) {
    await this.authService.kakaoLogin(query.code);
  }

  @Public()
  @Get('/hash')
  async validateUser(@Query('hash') hash: string): Promise<boolean> {
    return await bcrypt.compare(
      hash,
      '$2b$12$dkong8YL5HYPgZ9p/HNBGeN7ZKcuMg.QpFjDUzLrf2lt7kARStoye',
    );
  }
}
