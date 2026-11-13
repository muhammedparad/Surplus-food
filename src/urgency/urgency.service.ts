import { Injectable } from '@nestjs/common';
import { matchingConfig } from '../matching/matching.config.js';

export interface UrgencyResult {
  score: number;         // 0–1 (1 = most urgent)
  isAlert: boolean;      // true when score exceeds the alert threshold
  minutesRemaining: number;
}

/**
 * Pure urgency calculation — no DI required.
 *
 * Returns a score of 1 when the donation expires within
 * `urgencyHorizonMinutes` and 0 when there is plenty of time.
 */
export function calculateUrgency(minutesUntilExpiry: number): UrgencyResult {
  const horizon = matchingConfig.urgencyHorizonMinutes;
  const clamped = Math.max(0, minutesUntilExpiry);
  const score = Math.min(1, Math.max(0, 1 - clamped / horizon));
  const isAlert = clamped <= horizon * 0.25; // alert in final 25 % of horizon
  return { score, isAlert, minutesRemaining: clamped };
}

@Injectable()
export class UrgencyService {
  /**
   * Calculate urgency for a donation given minutes until it expires.
   */
  calculateUrgency(minutesUntilExpiry: number): UrgencyResult {
    return calculateUrgency(minutesUntilExpiry);
  }

  /**
   * Returns true when a donation is in the alert window (≤ 25 % of horizon).
   */
  checkUrgencyAlert(minutesUntilExpiry: number): boolean {
    return calculateUrgency(minutesUntilExpiry).isAlert;
  }
}
