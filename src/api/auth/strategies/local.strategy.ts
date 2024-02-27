import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'nameBirthId',
      passReqToCallback: false,
    });
  }

  async validate(nameBirthId: string, password: string): Promise<any> {
    const user = this.authService.validateUser(nameBirthId, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
