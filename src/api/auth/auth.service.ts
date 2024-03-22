/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/api/users/users.service';
import { SignUpDto } from './dto/signUp.dto';
import { User } from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenIdsStorage } from './refreshTokenIdsStorage';
import { JwtRefreshStrategy } from './strategies/jwtRefresh.strategy';
import { JwtPayload } from './interface/jwtPayload.interface';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    private readonly httpService: HttpService,
  ) {}

  async create(signUpDto: SignUpDto): Promise<User> {
    // console.log(signUpDto);
    const user = await this.usersService.create(signUpDto);
    delete user.password;

    return user;
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.validateUser(
      signInDto.nameBirthId,
      signInDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload: JwtPayload = {
      sub: user.userId,
      name: user.name,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });

    await this.refreshTokenIdsStorage.insert(user.userId, refreshToken);

    return {
      id: user.userId,
      email: user.email,
      name: user.name,
      expiresIn: 24 * 60 * 60,
      accessToken,
      refreshToken,
    };
  }

  async validateUser(
    nameBirthId: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findByNameBirthId(nameBirthId);
    if (user && (await user.checkPassword(password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async refreshAccessToken(
    refreshToken: string,
    user: User,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const isValid = await this.refreshTokenIdsStorage.validate(
      user.userId,
      refreshToken,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const payload: JwtPayload = {
      sub: user.userId,
      name: user.name,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, expiresIn: 24 * 60 * 60 };
  }

  async invalidateToken(refreshToken: string): Promise<void> {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken);
      await this.refreshTokenIdsStorage.invalidate(decoded.sub);
    } catch (error) {
      throw new UnauthorizedException('fail to invalid token');
    }
  }

  async verifyPayload(payload: JwtPayload): Promise<User> {
    let user: User;

    try {
      user = await this.usersService.findOne({
        where: { userId: payload.sub },
      });
    } catch (error) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async kakaoLogin(code: string) {
    const config = {
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_API,
      redirect_uri: process.env.CODE_REDIRECT_URI,
      code,
    };
    const params = new URLSearchParams(config).toString();
    const tokenHeaders = {
      'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
    };
    const tokenUrl = `https://kauth.kakao.com/oauth/token?${params}`;

    const res = await firstValueFrom(
      this.httpService.post(tokenUrl, '', { headers: tokenHeaders }),
    );
    console.log(res.data);

    // url을 다음과 같이 바꾸면 아래의 요청방식 3가지 중 하나로 요청할 수 있다.
    // const tokenUrl = `https://kauth.kakao.com/oauth/token?`

    //아래의 3가지 방법은 2번째 인자로 ''(빈문자열)이 아닌 params를 받는다.
    //2번 const res = await firstValueFrom(
    // this.http.post(tokenUrl, params, { headers: tokenHeaders }),
    // );

    //3번 const res = await this.http.post(tokenUrl, params, { headers: tokenHeaders }).toPromise()

    //4번 await axios.post(tokenUrl, params, { headers: tokenHeaders }).then((res) => {
    //   console.log(res.data);
    // });
  }

  // async OAuthLogin({ socialLoginDto }: IAuthServiceSocialLogin) {
  //   const { email } = socialLoginDto;
  //   let user = await this.usersService.findByEmail({ email });

  //   if (!user)
  //     user = await this.usersService.createUser({
  //       createUserDto: socialLoginDto,
  //     });

  //   const accessToken = this.getAccessToken({ userId: user.id });
  //   const refreshToken = this.getRefreshToken({ userId: user.id });

  //   return { accessToken, refreshToken };
  // }
}
