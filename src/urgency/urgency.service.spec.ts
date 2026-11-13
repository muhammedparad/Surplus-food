import { describe, it, expect } from 'vitest';
import { calculateUrgency, UrgencyService } from './urgency.service.js';
import { matchingConfig } from '../matching/matching.config.js';

describe('calculateUrgency (pure)', () => {
  const horizon = matchingConfig.urgencyHorizonMinutes; // 240

  it('returns score=0 when plenty of time remains', () => {
    const { score } = calculateUrgency(horizon + 60);
    expect(score).toBe(0);
  });

  it('returns score=1 when donation has already expired', () => {
    const { score } = calculateUrgency(0);
    expect(score).toBe(1);
  });

  it('returns score=1 for negative minutes remaining', () => {
    const { score } = calculateUrgency(-10);
    expect(score).toBe(1);
  });

  it('returns increasing score as minutes decrease', () => {
    const high = calculateUrgency(60);
    const low = calculateUrgency(200);
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('sets isAlert=true when inside 25% of horizon', () => {
    // 25% of 240 = 60 min; anything ≤ 60 is alert
    expect(calculateUrgency(59).isAlert).toBe(true);
    expect(calculateUrgency(60).isAlert).toBe(true);
  });

  it('sets isAlert=false when outside 25% of horizon', () => {
    expect(calculateUrgency(61).isAlert).toBe(false);
  });

  it('reports correct minutesRemaining', () => {
    expect(calculateUrgency(90).minutesRemaining).toBe(90);
    expect(calculateUrgency(-5).minutesRemaining).toBe(0); // clamped to 0
  });
});

describe('UrgencyService', () => {
  const service = new UrgencyService();

  it('delegates calculateUrgency to pure function', () => {
    const result = service.calculateUrgency(120);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it('checkUrgencyAlert returns true in alert window', () => {
    expect(service.checkUrgencyAlert(30)).toBe(true);
  });

  it('checkUrgencyAlert returns false outside alert window', () => {
    expect(service.checkUrgencyAlert(200)).toBe(false);
  });
});
