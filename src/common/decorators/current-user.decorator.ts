import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedUser,
  RequestWithAuth,
} from '../interfaces/authenticated-user.interface.js';

export const CurrentUser = createParamDecorator(
  <K extends keyof AuthenticatedUser>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | AuthenticatedUser[K] | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
