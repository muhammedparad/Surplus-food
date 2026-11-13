import { SetMetadata } from '@nestjs/common';
import { SKIP_CSRF_KEY } from '../constants/auth.constants.js';

export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
