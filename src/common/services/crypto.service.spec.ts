import { BadRequestException } from '@nestjs/common';
import { CryptoService } from './crypto.service.js';

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
  });

  it('hashes and verifies passwords using Argon2id', async () => {
    const hash = await cryptoService.hashPassword('Str0ng!Pass123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await cryptoService.verifyPassword(hash, 'Str0ng!Pass123')).toBe(true);
    expect(await cryptoService.verifyPassword(hash, 'WrongPassword!')).toBe(false);
  });

  it('enforces configurable password policy rules', () => {
    const policy = {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: true,
    };

    expect(() =>
      cryptoService.validatePasswordPolicy('ValidPass123!', policy),
    ).not.toThrow();

    expect(() => cryptoService.validatePasswordPolicy('short1!', policy)).toThrow(
      BadRequestException,
    );
    expect(() =>
      cryptoService.validatePasswordPolicy('alllowercase1!', policy),
    ).toThrow(BadRequestException);
    expect(() =>
      cryptoService.validatePasswordPolicy('NoSpecialChar123', policy),
    ).toThrow(BadRequestException);
  });

  it('hashes opaque tokens deterministically via SHA-256 and never matches raw token', () => {
    const raw = cryptoService.generateOpaqueToken(48);
    const hash = cryptoService.hashToken(raw);
    expect(raw.length).toBeGreaterThanOrEqual(64);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(raw);
    expect(cryptoService.hashToken(raw)).toBe(hash);
  });

  it('generates valid PKCE S256 verifier/challenge pairs and signed HMAC payloads', () => {
    const { codeVerifier, codeChallenge } = cryptoService.generatePkcePair();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeChallenge).not.toBe(codeVerifier);

    const secret = 'test-signing-secret-with-sufficient-entropy-32+';
    const token = cryptoService.signPayload({ userId: 'u1', mode: 'link' }, secret, 60);
    const verified = cryptoService.verifySignedPayload<{ userId: string; mode: string }>(
      token,
      secret,
    );
    expect(verified?.userId).toBe('u1');
    expect(verified?.mode).toBe('link');

    expect(cryptoService.verifySignedPayload(`${token}tampered`, secret)).toBeNull();
    expect(
      cryptoService.verifySignedPayload(token, 'wrong-secret-key-with-sufficient-length'),
    ).toBeNull();
  });
});
