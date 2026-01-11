import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';

export class InvalidatedRefreshTokenError extends Error {}

@Injectable()
export class RefreshTokenIdsStorage {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // UserRepository 주입
  ) {}

  async insert(userId: number, refreshToken: string): Promise<void> {
    await this.usersRepository.update({ userId }, { refreshToken });
  }

  async validate(userId: number, refreshToken: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: {
        userId,
      },
    });
    if (!user || !user.refreshToken) {
      throw new Error('Invalidated Refresh Token Error');
    }
    return user.refreshToken === refreshToken;
  }

  async invalidate(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { refreshToken: null });
  }
}
