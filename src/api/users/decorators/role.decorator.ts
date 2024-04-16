import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'level';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
