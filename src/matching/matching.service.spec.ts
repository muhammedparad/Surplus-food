import { describe, it, expect } from 'vitest';
import { rankNgos, type Ngo, type DonationContext } from './matching.service.js';

const baseNgo = (overrides: Partial<Ngo> = {}): Ngo => ({
  id: 'ngo-1',
  name: 'Test NGO',
  latitude: 3.139,
  longitude: 101.687,
  servingCapacity: 50,
  status: 'ACTIVE',
  acceptedCategories: [],
  ...overrides,
});

const baseDonation = (overrides: Partial<DonationContext> = {}): DonationContext => ({
  latitude: 3.139,
  longitude: 101.687,
  category: 'MEALS',
  minutesUntilExpiry: 120,
  ...overrides,
});

describe('rankNgos', () => {
  it('returns empty array when no NGOs provided', () => {
    expect(rankNgos([], baseDonation())).toEqual([]);
  });

  it('filters out SUSPENDED NGOs', () => {
    const ngo = baseNgo({ status: 'SUSPENDED' });
    expect(rankNgos([ngo], baseDonation())).toHaveLength(0);
  });

  it('filters out NGOs beyond max radius', () => {
    // Kuala Lumpur → Singapore ≈ 350 km, well beyond 25 km limit
    const ngo = baseNgo({ latitude: 1.3521, longitude: 103.8198 });
    expect(rankNgos([ngo], baseDonation())).toHaveLength(0);
  });

  it('filters out NGOs with insufficient serving capacity', () => {
    const ngo = baseNgo({ servingCapacity: 0 });
    expect(rankNgos([ngo], baseDonation())).toHaveLength(0);
  });

  it('filters out NGOs that do not accept the donation category', () => {
    const ngo = baseNgo({ acceptedCategories: ['RICE'] });
    // Donation is MEALS — NGO only accepts RICE
    expect(rankNgos([ngo], baseDonation({ category: 'MEALS' }))).toHaveLength(0);
  });

  it('includes NGO when category matches', () => {
    const ngo = baseNgo({ acceptedCategories: ['MEALS'] });
    expect(rankNgos([ngo], baseDonation({ category: 'MEALS' }))).toHaveLength(1);
  });

  it('includes NGO with empty acceptedCategories (accepts all)', () => {
    const ngo = baseNgo({ acceptedCategories: [] });
    expect(rankNgos([ngo], baseDonation({ category: 'BREAD' }))).toHaveLength(1);
  });

  it('ranks closer NGO higher than farther one (same capacity, same urgency)', () => {
    const nearby = baseNgo({ id: 'close', latitude: 3.14, longitude: 101.69 });
    // ~2 km north
    const farther = baseNgo({ id: 'far', latitude: 3.16, longitude: 101.72 });
    // ~4 km north-east
    const results = rankNgos([farther, nearby], baseDonation());
    expect(results[0].ngo.id).toBe('close');
  });

  it('assigns higher score for more urgent donations', () => {
    const ngo = baseNgo();
    const urgent = rankNgos([ngo], baseDonation({ minutesUntilExpiry: 10 }));
    const notUrgent = rankNgos([ngo], baseDonation({ minutesUntilExpiry: 230 }));
    expect(urgent[0].score).toBeGreaterThan(notUrgent[0].score);
  });

  it('returns distanceKm as a number', () => {
    const ngo = baseNgo();
    const [result] = rankNgos([ngo], baseDonation());
    expect(typeof result.distanceKm).toBe('number');
  });
});
