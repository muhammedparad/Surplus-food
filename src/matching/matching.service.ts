import { Injectable } from '@nestjs/common';
import type { FoodCategory, OrganizationStatus } from '../generated/prisma/enums.js';
import { haversineDistance } from '../common/utils/geo.js';
import { matchingConfig } from './matching.config.js';

/** Minimal NGO shape required by the matching engine. */
export interface Ngo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  servingCapacity: number;
  status: (typeof OrganizationStatus)[keyof typeof OrganizationStatus];
  acceptedCategories: (typeof FoodCategory)[keyof typeof FoodCategory][];
}

/** Input donation data for the ranking algorithm. */
export interface DonationContext {
  latitude: number;
  longitude: number;
  /** Food category to match (e.g. 'MEALS', 'RICE'). */
  category: (typeof FoodCategory)[keyof typeof FoodCategory];
  /** Minutes remaining until expiry. Used for urgency weighting. */
  minutesUntilExpiry: number;
}

export interface RankedNgo {
  ngo: Ngo;
  distanceKm: number;
  score: number;
}

/**
 * Pure function that ranks a list of NGOs against a donation context.
 * No DB calls — all data is provided by the caller (DonationsService).
 *
 * Scoring formula (higher = better):
 *   score = distanceWeight * (1 - distanceKm / maxRadius)
 *         + urgencyWeight  * (1 - minutesUntilExpiry / urgencyHorizon)
 *
 * Both components are clamped to [0, 1].
 */
export function rankNgos(ngos: Ngo[], donation: DonationContext): RankedNgo[] {
  const { maxMatchRadiusKm, urgencyHorizonMinutes, urgencyWeight, distanceWeight, minServingCapacity } =
    matchingConfig;

  const eligible = ngos.filter(
    (ngo) =>
      ngo.status === 'ACTIVE' &&
      ngo.servingCapacity >= minServingCapacity &&
      (ngo.acceptedCategories.length === 0 || ngo.acceptedCategories.includes(donation.category)),
  );

  const withDistance: Array<{ ngo: Ngo; distanceKm: number }> = eligible
    .map((ngo) => ({
      ngo,
      distanceKm: haversineDistance(donation.latitude, donation.longitude, ngo.latitude, ngo.longitude),
    }))
    .filter(({ distanceKm }) => distanceKm <= maxMatchRadiusKm);

  const urgencyFraction = Math.min(
    1,
    Math.max(0, 1 - donation.minutesUntilExpiry / urgencyHorizonMinutes),
  );

  return withDistance
    .map(({ ngo, distanceKm }) => {
      const distanceFraction = Math.max(0, 1 - distanceKm / maxMatchRadiusKm);
      const score =
        distanceWeight * distanceFraction + urgencyWeight * urgencyFraction;
      return { ngo, distanceKm, score };
    })
    .sort((a, b) => b.score - a.score);
}

@Injectable()
export class MatchingService {
  /**
   * Rank NGOs for a donation. Delegates to the pure `rankNgos` function.
   *
   * @param ngos   - Pre-fetched list of candidate NGOs (from OrganizationsService or PrismaService).
   * @param donation - Donation context including location, category, and urgency.
   */
  rankNgos(ngos: Ngo[], donation: DonationContext): RankedNgo[] {
    return rankNgos(ngos, donation);
  }
}
