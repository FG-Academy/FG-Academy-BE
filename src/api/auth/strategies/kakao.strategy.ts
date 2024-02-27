// social-kakao-strategy.ts

import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';

export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor() {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      // clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: process.env.KAKAO_CALLBACK_URL,
      scope: ['profile_nickname'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // 토큰과 프로파일을 한번 확인해보자
    console.log('accessToken: ', accessToken);
    console.log('refreshToken: ', refreshToken);
    console.log(profile);

    return {
      // email: profile._json.kakao_account.email,
      password: String(profile.id),
      nickname: profile.displayName,
    };
  }
}
