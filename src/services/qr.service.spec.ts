
import { QrService } from './qr.service';

describe('QrService', () => {
  let service: QrService;

  beforeEach(() => {
    service = new QrService();
  });

  it('should verify correct code', async () => {
    const code = service.generateSecureCode();
    const hash = await service.hashCode(code);
    
    expect(await service.verifyCode(code, hash)).toBe(true);
  });

  it('should fail verification for incorrect code', async () => {
    const code = service.generateSecureCode();
    const hash = await service.hashCode(code);
    
    expect(await service.verifyCode('WRONG', hash)).toBe(false);
  });
});
