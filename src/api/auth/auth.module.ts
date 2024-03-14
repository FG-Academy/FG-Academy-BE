import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/api/users/users.module';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenIdsStorage } from './refreshTokenIdsStorage';
import { JwtRefreshStrategy } from './strategies/jwtRefresh.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
// import { KakaoStrategy } from './strategies/kakao.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JWTAuthGuard } from './guards/jwtAuth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    HttpModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '10h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenIdsStorage,
    JwtRefreshStrategy,
    // KakaoStrategy,
    {
      provide: APP_GUARD,
      useClass: JWTAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
