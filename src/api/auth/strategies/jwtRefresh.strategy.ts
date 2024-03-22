import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../interface/jwtPayload.interface';
import { AuthService } from '../auth.service';

const extractJwtFromCookie: JwtFromRequestFunction = (request: Request) => {
  return request.cookies['refreshToken']!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie]),
      secretOrKey: process.env.JWT_SECRET || 'secret',
      ignoreExpiration: false,
      passReqToCallback: false,
    });
    this.logger.warn('JwtRefreshTokenStrategy initialized');
  }

  async validate(payload: JwtPayload): Promise<any> {
    console.log('payload', payload);
    return this.authService.verifyPayload(payload);
  }
}
