import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signUp.dto';
// import { LocalAuthGuard } from './guards/localAuth.guard';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './dto/signIn.dto';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { Request, Response } from 'express';
import { JwtRefreshTokenGuard } from './guards/jwtRefreshAuth.guard';
import { User } from 'src/entities/user.entity';
// import { KakaoAuthGuard } from './guards/kakaoAuth.guard';
// import {
//   SocialUser,
//   SocialUserAfterAuth,
// } from './decorators/socialUser.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.create(signUpDto);
  }

  // @UseGuards(LocalAuthGuard)
  @Public()
  @UseInterceptors(TokenInterceptor)
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    console.log(signInDto);
    return await this.authService.signIn(signInDto);
  }

  @Public()
  @UseGuards(JwtRefreshTokenGuard)
  // @UseInterceptors(TokenInterceptor)
  @Get('refresh-token')
  async refreshToken(@Req() request: Request) {
    const refreshToken = request.cookies['refreshToken'];
    return await this.authService.refreshAccessToken(
      refreshToken,
      request.user as User,
    );
  }

  @Post('invalidate-token')
  async invalidateToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refreshToken'];
    await this.authService.invalidateToken(refreshToken);
    response.clearCookie('refreshToken');
    return { message: 'Token invalidated successfully' };
  }

  @Get('kakao-login')
  @Header('Content-Type', 'text/html')
  async kakaoRedirect(@Res() res: Response): Promise<void> {
    const url = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_API}&redirect_uri=${process.env.CODE_REDIRECT_URI}`;
    res.redirect(url);
  }

  // @UseInterceptors(TokenInterceptor)
  // @UseGuards(KakaoAuthGuard)
  // @Get('login/kakao')
  // async kakaoCallback(
  //   @SocialUser() socialUser: SocialUserAfterAuth,
  //   @Res({ passthrough: true }) res: Response,
  // ): Promise<void> {
  //   const { accessToken, refreshToken } = await this.authService.OAuthLogin({
  //     socialLoginDto: socialUser,
  //   });

  //   res.setHeader('Authorization', `Bearer ${accessToken}`);
  //   res.cookie('refresh_token', refreshToken);

  //   res.redirect('/');
  // }
}
