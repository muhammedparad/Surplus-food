import { describe, it, expect } from 'vitest';
import { optimizeRoute, type RouteTask } from './route.service.js';

// KL city area coordinates
const VOLUNTEER = { lat: 3.139, lon: 101.687 };

const task = (id: string, type: RouteTask['type'], lat: number, lon: number): RouteTask => ({
  id,
  type,
  latitude: lat,
  longitude: lon,
});

describe('optimizeRoute', () => {
  it('returns empty route for no tasks', () => {
    const result = optimizeRoute([], VOLUNTEER.lat, VOLUNTEER.lon);
    expect(result.orderedTasks).toHaveLength(0);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.estimatedTravelMinutes).toBe(0);
  });

  it('handles a single pickup task', () => {
    const tasks = [task('t1', 'PICKUP', 3.145, 101.693)];
    const result = optimizeRoute(tasks, VOLUNTEER.lat, VOLUNTEER.lon);
    expect(result.orderedTasks).toHaveLength(1);
    expect(result.orderedTasks[0].type).toBe('PICKUP');
    expect(result.totalDistanceKm).toBeGreaterThan(0);
  });

  it('places PICKUP before DELIVERY for the same id', () => {
    const tasks = [
      task('t1', 'DELIVERY', 3.148, 101.691), // should come second
      task('t1', 'PICKUP', 3.141, 101.688),   // should come first
    ];
    const result = optimizeRoute(tasks, VOLUNTEER.lat, VOLUNTEER.lon);
    const pickupIdx = result.orderedTasks.findIndex((t) => t.type === 'PICKUP');
    const deliveryIdx = result.orderedTasks.findIndex((t) => t.type === 'DELIVERY');
    expect(pickupIdx).toBeLessThan(deliveryIdx);
  });

  it('accumulates total distance correctly for two tasks', () => {
    const tasks = [
      task('a', 'PICKUP', 3.141, 101.690),
      task('b', 'PICKUP', 3.145, 101.695),
    ];
    const result = optimizeRoute(tasks, VOLUNTEER.lat, VOLUNTEER.lon);
    expect(result.totalDistanceKm).toBeGreaterThan(0);
  });

  it('calculates faster ETA for CAR than WALKING', () => {
    const tasks = [task('t1', 'PICKUP', 3.145, 101.693)];
    const byCar = optimizeRoute(tasks, VOLUNTEER.lat, VOLUNTEER.lon, 'CAR');
    const onFoot = optimizeRoute(tasks, VOLUNTEER.lat, VOLUNTEER.lon, 'WALKING');
    expect(byCar.estimatedTravelMinutes).toBeLessThan(onFoot.estimatedTravelMinutes);
  });

  it('handles multi-task route with correct pickup-before-delivery ordering', () => {
    const tasks = [
      task('order1', 'DELIVERY', 3.155, 101.700),
      task('order2', 'PICKUP', 3.142, 101.692),
      task('order1', 'PICKUP', 3.140, 101.688),
      task('order2', 'DELIVERY', 3.160, 101.705),
    ];
    const result = optimizeRoute(tasks, VOLUNTEER.lat, VOLUNTEER.lon);
    expect(result.orderedTasks).toHaveLength(4);

    // Every DELIVERY must be preceded by its PICKUP somewhere in the array
    for (const task of result.orderedTasks.filter((t) => t.type === 'DELIVERY')) {
      const pickupIdx = result.orderedTasks.findIndex(
        (t) => t.id === task.id && t.type === 'PICKUP',
      );
      const deliveryIdx = result.orderedTasks.indexOf(task);
      expect(pickupIdx).toBeLessThan(deliveryIdx);
    }
  });
});
