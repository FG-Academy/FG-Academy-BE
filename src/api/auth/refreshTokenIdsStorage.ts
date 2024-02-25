/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
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
    // await this.cacheManger.set(this.getKey(userId), tokenId);
    // await this.redisClient.set(this.getKey(userId), tokenId);
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

    // cache-manager 방식
    // const storedId = await this.cacheManger.get(this.getKey(userId));
    // if (!storedId) {
    //   throw new InvalidatedRefreshTokenError();
    // }
    // return storedId === tokenId;

    // ioredis 방식
    // const storedId = await this.redisClient.get(this.getKey(userId));
    // if (storedId !== tokenId) {
    //   throw new InvalidatedRefreshTokenError();
    // }
    // return storedId === tokenId;
  }

  async invalidate(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { refreshToken: null });
    // await this.cacheManger.del(this.getKey(userId));
    // await this.redisClient.del(this.getKey(userId));
  }

  // private getKey(userId: number): string {
  //   return `user-${userId}`;
  // }
}
