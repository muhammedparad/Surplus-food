import type { Request } from 'express';
import type { UserStatus } from '../../generated/prisma/enums.js';

export interface JwtAccessPayload {
  sub: string;
  sid: string;
  tv: number;
  typ: 'access';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  activeOrganizationId: string | null;
  sessionId: string;
  tokenVersion: number;
}

export interface OrganizationContext {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  memberId: string;
  roleSlugs: string[];
  permissionKeys: string[];
}

export interface RequestWithAuth extends Request {
  user?: AuthenticatedUser;
  organizationContext?: OrganizationContext;
  cookies: Record<string, string | undefined>;
}
