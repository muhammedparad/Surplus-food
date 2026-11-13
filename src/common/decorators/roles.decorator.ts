import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants.js';

export const Roles = (...roles: string[]) =>
  SetMetadata(
    ROLES_KEY,
    roles.map((r) => r.trim().toLowerCase()),
  );
