
import { haversineDistance } from '../utils/geo';
import { calculateUrgency } from './urgency.service';
import { matchingConfig } from '../config/matching.config';

export interface Donation {
  id: string;
  organizationId: string;
  category: string;
  totalQuantity: number;
  collectionDeadline: Date;
  pickupPoint: { latitude: number; longitude: number };
}

export interface Ngo {
  id: string;
  servingCapacity: number;
  acceptedCategories: string[];
  serviceRadiusKm?: number;
  location: { latitude: number; longitude: number };
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

export interface Commitment {
  ngoId: string;
  servingsCommittedToday: number;
}

export interface MatchResult {
  ngoId: string;
  rank: number;
  score: number;
  distanceKm: number;
}

export const rankNgos = (
  donation: Donation,
  ngos: Ngo[],
  commitments: Commitment[],
  now: Date
): MatchResult[] => {
  const horizon = matchingConfig.urgencyHorizonMinutes;
  const radius = matchingConfig.maxMatchRadiusKm;
  const speed = matchingConfig.assumedTravelSpeedKmh;

  const minutesLeft = (donation.collectionDeadline.getTime() - now.getTime()) / (1000 * 60);
  const u = calculateUrgency(minutesLeft, horizon);

  const eligibleNgos = ngos.filter(ngo => {
    // 1. Eligibility filter
    if (ngo.status !== 'ACTIVE') return false;

    const d = haversineDistance(
      donation.pickupPoint.latitude,
      donation.pickupPoint.longitude,
      ngo.location.latitude,
      ngo.location.longitude
    );

    const commitment = commitments.find(c => c.ngoId === ngo.id)?.servingsCommittedToday || 0;
    const remainingCapacity = ngo.servingCapacity - commitment;

    if (d > (ngo.serviceRadiusKm || radius)) return false;
    if (remainingCapacity <= 0) return false;
    if (!ngo.acceptedCategories.includes(donation.category)) return false;

    const travelMin = (d / speed) * 60;
    if (travelMin > minutesLeft) return false;

    return true;
  });

  const rankedNgos = eligibleNgos.map(ngo => {
    const d = haversineDistance(
      donation.pickupPoint.latitude,
      donation.pickupPoint.longitude,
      ngo.location.latitude,
      ngo.location.longitude
    );

    const commitment = commitments.find(c => c.ngoId === ngo.id)?.servingsCommittedToday || 0;
    const remainingCapacity = ngo.servingCapacity - commitment;

    // Component scores
    const S_d = 1 - d / radius;
    const S_c = Math.min(1, remainingCapacity / donation.totalQuantity);
    const travelMin = (d / speed) * 60;
    const S_s = Math.max(0, Math.min(1, (minutesLeft - travelMin) / minutesLeft));

    // Urgency-weighted score
    const w_d = 0.4 + 0.25 * u;
    const w_c = 0.4 - 0.25 * u;
    const w_s = 0.2;

    const score = w_d * S_d + w_c * S_c + w_s * S_s;

    return {
      ngoId: ngo.id,
      score: Math.round(score * 10000) / 10000,
      distanceKm: d,
      remainingCapacity
    };
  });

  // Tie-break and sort
  rankedNgos.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (b.remainingCapacity !== a.remainingCapacity) return b.remainingCapacity - a.remainingCapacity;
    return a.ngoId.localeCompare(b.ngoId);
  });

  return rankedNgos.map((ngo, index) => ({
    ngoId: ngo.ngoId,
    rank: index + 1,
    score: ngo.score,
    distanceKm: ngo.distanceKm
  }));
};
