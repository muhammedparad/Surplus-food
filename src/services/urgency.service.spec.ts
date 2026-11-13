
import { UrgencyService } from './urgency.service';

describe('UrgencyService', () => {
  it('should trigger alert when urgency threshold is breached', () => {
    const service = new UrgencyService();
    // Horizon is 240. 20% of 240 is 48 mins left.
    // 1 - (48/240) = 0.8
    expect(service.checkUrgencyAlert(40)).toBe(true);
    expect(service.checkUrgencyAlert(100)).toBe(false);
  });
});
