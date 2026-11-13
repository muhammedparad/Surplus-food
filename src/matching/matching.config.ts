/**
 * Matching engine configuration constants.
 * Tune these values to adjust how the NGO-matching algorithm behaves.
 */
export const matchingConfig = {
  /** Maximum minutes before expiry at which a donation is considered urgent. */
  urgencyHorizonMinutes: 240,

  /** Maximum radius (km) in which to look for NGO matches. */
  maxMatchRadiusKm: 25,

  /** Assumed average volunteer travel speed (km/h) for ETA calculations. */
  volunteerSpeedKmh: 20,

  /** Minimum NGO serving-capacity units to be eligible for matching. */
  minServingCapacity: 1,

  /** Weight applied to urgency score (0-1) when ranking NGOs. */
  urgencyWeight: 0.4,

  /** Weight applied to distance score (0-1) when ranking NGOs. */
  distanceWeight: 0.6,
} as const;
