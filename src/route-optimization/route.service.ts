import { Injectable } from '@nestjs/common';
import type { TransportType } from '../generated/prisma/enums.js';
import { haversineDistance } from '../common/utils/geo.js';

export type TaskType = 'PICKUP' | 'DELIVERY';

export interface RouteTask {
  id: string;
  type: TaskType;
  latitude: number;
  longitude: number;
  /** Label for display (e.g. donor name, NGO name). */
  label?: string;
}

export interface OptimizedRoute {
  orderedTasks: RouteTask[];
  totalDistanceKm: number;
  /** Estimated travel time in minutes based on transport speed. */
  estimatedTravelMinutes: number;
}

/** km/h speed assumptions per transport mode. */
const SPEED_KMH: Record<string, number> = {
  WALKING: 5,
  BICYCLE: 15,
  MOTORBIKE: 40,
  CAR: 60,
  OTHER: 20,
};

function getSpeed(transportType?: string): number {
  if (!transportType) return SPEED_KMH.OTHER;
  return SPEED_KMH[transportType] ?? SPEED_KMH.OTHER;
}

/**
 * Nearest-neighbour greedy route optimisation.
 *
 * Rules enforced:
 *   1. PICKUP tasks must be sequenced before any DELIVERY task for the same `id`.
 *   2. Among remaining eligible tasks, always pick the nearest unvisited one.
 *
 * @param tasks         - Unordered list of pickups and deliveries.
 * @param startLatitude - Volunteer's current latitude.
 * @param startLongitude - Volunteer's current longitude.
 * @param transportType - Volunteer's transport mode (affects ETA).
 */
export function optimizeRoute(
  tasks: RouteTask[],
  startLatitude: number,
  startLongitude: number,
  transportType?: (typeof TransportType)[keyof typeof TransportType],
): OptimizedRoute {
  if (tasks.length === 0) {
    return { orderedTasks: [], totalDistanceKm: 0, estimatedTravelMinutes: 0 };
  }

  const remaining = [...tasks];
  const ordered: RouteTask[] = [];
  let currentLat = startLatitude;
  let currentLon = startLongitude;
  let totalDistanceKm = 0;

  while (remaining.length > 0) {
    // A DELIVERY task is eligible only after its corresponding PICKUP has been added.
    const pickedUpIds = new Set(ordered.filter((t) => t.type === 'PICKUP').map((t) => t.id));

    const eligible = remaining.filter(
      (t) => t.type === 'PICKUP' || pickedUpIds.has(t.id),
    );

    if (eligible.length === 0) {
      // Safety fallback: no eligible task found — add first remaining to avoid infinite loop.
      ordered.push(remaining[0]);
      remaining.splice(0, 1);
      continue;
    }

    // Find nearest eligible task.
    let nearest = eligible[0];
    let nearestDist = haversineDistance(currentLat, currentLon, nearest.latitude, nearest.longitude);

    for (let i = 1; i < eligible.length; i++) {
      const task = eligible[i];
      const dist = haversineDistance(currentLat, currentLon, task.latitude, task.longitude);
      if (dist < nearestDist) {
        nearest = task;
        nearestDist = dist;
      }
    }

    ordered.push(nearest);
    totalDistanceKm += nearestDist;
    currentLat = nearest.latitude;
    currentLon = nearest.longitude;

    // Remove from remaining (match by id AND type to handle duplicate ids).
    const idx = remaining.findIndex((t) => t.id === nearest.id && t.type === nearest.type);
    if (idx !== -1) remaining.splice(idx, 1);
  }

  const speedKmh = getSpeed(transportType as string | undefined);
  const estimatedTravelMinutes = (totalDistanceKm / speedKmh) * 60;

  return { orderedTasks: ordered, totalDistanceKm, estimatedTravelMinutes };
}

@Injectable()
export class RouteOptimizationService {
  /**
   * Optimise the pickup/delivery route for a volunteer.
   *
   * @param tasks         - Tasks to sequence.
   * @param startLatitude - Volunteer's current latitude.
   * @param startLongitude - Volunteer's current longitude.
   * @param transportType - Volunteer transport mode.
   */
  optimizeRoute(
    tasks: RouteTask[],
    startLatitude: number,
    startLongitude: number,
    transportType?: (typeof TransportType)[keyof typeof TransportType],
  ): OptimizedRoute {
    return optimizeRoute(tasks, startLatitude, startLongitude, transportType);
  }
}
