import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import argon2 from 'argon2';
import type { PasswordPolicyConfig } from '../../config/auth.config.js';
import { DUMMY_ARGON2_HASH } from '../constants/auth.constants.js';

@Injectable()
export class CryptoService {
  async hashPassword(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(passwordHash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, plainPassword);
    } catch {
      return false;
    }
  }

  async verifyDummyPassword(plainPassword: string): Promise<void> {
    try {
      await argon2.verify(DUMMY_ARGON2_HASH, plainPassword);
    } catch {
      // Timing equalization only
    }
  }

  validatePasswordPolicy(password: string, policy: PasswordPolicyConfig): void {
    const violations: string[] = [];

    if (password.length < policy.minLength) {
      violations.push(`at least ${policy.minLength} characters`);
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      violations.push('an uppercase letter');
    }
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      violations.push('a lowercase letter');
    }
    if (policy.requireNumber && !/\d/.test(password)) {
      violations.push('a number');
    }
    if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
      violations.push('a special character');
    }

    if (violations.length > 0) {
      throw new BadRequestException(
        `Password does not meet security policy: must contain ${violations.join(', ')}`,
      );
    }
  }

  generateOpaqueToken(byteLength: number = 48): string {
    return crypto.randomBytes(byteLength).toString('base64url');
  }

  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }

  timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier, 'ascii')
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  signPayload<T extends object>(payload: T, secret: string, ttlSeconds: number): string {
    const envelope = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };
    const encoded = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(encoded, 'utf8')
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  verifySignedPayload<T extends object>(token: string, secret: string): T | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    if (!encoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encoded, 'utf8')
      .digest('base64url');

    if (!this.timingSafeEqual(signature, expectedSignature)) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as T & { exp?: number };
      if (typeof parsed.exp !== 'number' || parsed.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
