import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async create() {
    const user = this.usersRepository.create(data);

    return this.usersRepository.save(user);
  }
}
