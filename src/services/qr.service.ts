
import * as crypto from 'crypto';

export class QrService {
  generateSecureCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  }

  async hashCode(code: string): Promise<string> {
    // Using a simple crypto hash for demonstration, 
    // real implementation might use a proper hashing library like bcrypt
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  async verifyCode(code: string, hashedCode: string): Promise<boolean> {
    const hashedAttempt = await this.hashCode(code);
    return hashedAttempt === hashedCode;
  }
}
