import { SetMetadata } from '@nestjs/common';
import { REQUIRE_VERIFIED_EMAIL_KEY } from '../constants/auth.constants.js';

export const RequireVerifiedEmail = (required: boolean = true) =>
  SetMetadata(REQUIRE_VERIFIED_EMAIL_KEY, required);
