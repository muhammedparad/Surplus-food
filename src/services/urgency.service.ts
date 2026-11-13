export const calculateUrgency = (minutesLeft: number, horizonMinutes: number): number => {
  return Math.max(0, Math.min(1, 1 - (minutesLeft / horizonMinutes)));
};

import { matchingConfig } from '../config/matching.config';

export class UrgencyService {
  checkUrgencyAlert(minutesLeft: number): boolean {
    const horizon = matchingConfig.urgencyHorizonMinutes;
    // Threshold for alert: let's say 80% urgent
    const threshold = 0.8;
    const score = calculateUrgency(minutesLeft, horizon);
    return score >= threshold;
  }
}
