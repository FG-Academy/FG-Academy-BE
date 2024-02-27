import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuthService } from '../auth.service';

@Injectable()
export class TokenInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<{ accessToken: string; refreshToken?: string }>,
  ): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse<Response>();

        // if (data.accessToken) {
        //   response.cookie('accessToken', data.accessToken, {
        //     httpOnly: true,
        //     // sameSite: 'lax',
        //     secure: process.env.NODE_ENVIRONMENT === 'production', // HTTPS 환경에서만 사용하도록 설정 (개발 환경에 따라 주석 처리)
        //   });
        // }

        // refresh_token이 존재할 때만 쿠키에 설정
        if (data.refreshToken) {
          response.cookie('refreshToken', data.refreshToken, {
            httpOnly: true,
            // sameSite: 'lax',
            secure: process.env.NODE_ENVIRONMENT === 'production', // HTTPS 환경에서만 사용하도록 설정 (개발 환경에 따라 주석 처리)
          });
        }
      }),
    );
  }
}
