import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signUp.dto';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './dto/signIn.dto';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { Request } from 'express';
import { JwtRefreshTokenGuard } from './guards/jwtRefreshAuth.guard';
import { User } from 'src/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.create(signUpDto);
  }

  @Public()
  @Get('sign-up/emailCheck')
  async findEmailExist(@Query('email') email: string) {
    const result = await this.authService.verifyAndSendEmail(email);
    if (!result) return false;
    console.log(result);
    return { result };
  }

  // @UseGuards(LocalAuthGuard)
  @Public()
  @UseInterceptors(TokenInterceptor)
  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    // console.log(signInDto);
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
}
