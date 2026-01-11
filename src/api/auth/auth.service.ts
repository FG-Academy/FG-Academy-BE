/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/api/users/users.service';
import { SignUpDto } from './dto/signUp.dto';
import { User } from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenIdsStorage } from './refreshTokenIdsStorage';
import { JwtPayload } from './interface/jwtPayload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from 'src/entities/enrollment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(signUpDto: SignUpDto): Promise<User> {
    const user = await this.usersService.create(signUpDto);
    delete user.password;

    return user;
  }

  async verifyAndSendEmail(email: string) {
    const user = await this.usersService.findEmailExist(email);
    if (user) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }
    const verficationCode = await this.usersService.sendEmail(email);
    return verficationCode;
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.validateUser(
      signInDto.nameBirthId,
      signInDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    await this.usersService.updateLastLoginAt(user.userId);

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

    const enrollment = await this.enrollmentRepository.find({
      where: {
        user: { userId: user.userId },
        course: { status: 'active' },
      },
      relations: ['course'],
    });
    const enrollmentIds = enrollment.map(
      (enrollment) => enrollment.course.courseId,
    );

    return {
      id: user.userId,
      email: user.email,
      name: user.name,
      level: user.level,
      enrollmentIds,
      department: user.departmentName,
      expiresIn: 10 * 60 * 60,
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
    return { accessToken, expiresIn: 10 * 60 * 60 };
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
}
