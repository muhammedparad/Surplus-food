export interface Location {
  latitude: number;
  longitude: number;
}

export interface Task {
  id: string;
  type: 'PICKUP' | 'DELIVERY';
  pickupPointId?: string;
  deliveryLocationId?: string;
  pickupPoint?: Location;
  deliveryLocation?: Location;
}

export interface RouteOptimizationParams {
  volunteerLocation: Location;
  tasks: Task[];
}

export interface RouteStop {
  type: 'PICKUP' | 'DELIVERY';
  taskId: string;
  location: Location;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistanceKm: number;
}

import { haversineDistance } from '../utils/geo';

export const optimizeRoute = ({
  volunteerLocation,
  tasks
}: RouteOptimizationParams): OptimizedRoute => {
  const stops: RouteStop[] = [];
  let currentLocation = volunteerLocation;
  let remainingTasks = [...tasks];
  let totalDistance = 0;

  while (remainingTasks.length > 0) {
    let nextTask: Task | null = null;
    let nearestDist = Infinity;

    const validPickups = remainingTasks.filter(t => t.type === 'PICKUP' && t.pickupPoint);
    const validDeliveries = remainingTasks.filter(
      t => t.type === 'DELIVERY' && t.deliveryLocation
    );

    // Try to find deliveries for already picked-up items
    for (const task of validDeliveries) {
        if (stops.find(s => s.taskId === task.id && s.type === 'PICKUP')) {
            const dist = haversineDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              task.deliveryLocation!.latitude,
              task.deliveryLocation!.longitude
            );
            if (dist < nearestDist) {
              nearestDist = dist;
              nextTask = task;
            }
        }
    }

    // Try to find ANY pickup if no delivery found yet
    if (nextTask === null) {
        for (const task of validPickups) {
            const location = task.pickupPoint!;
            const dist = haversineDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              location.latitude,
              location.longitude
            );
            if (dist < nearestDist) {
              nearestDist = dist;
              nextTask = task;
            }
        }
    }
    
    // Fallback: Try to find ANY delivery if no pickup found (e.g. if we have a pickup elsewhere or don't have a pickup yet but can deliver)
    if (nextTask === null) {
      for (const task of validDeliveries) {
        const dist = haversineDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          task.deliveryLocation!.latitude,
          task.deliveryLocation!.longitude
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nextTask = task;
        }
      }
    }

    if (!nextTask) break;


    const stop: RouteStop = {
      type: nextTask.type,
      taskId: nextTask.id,
      location:
        nextTask.type === 'PICKUP'
          ? nextTask.pickupPoint!
          : nextTask.deliveryLocation!
    };

    stops.push(stop);
    totalDistance += nearestDist;

    currentLocation = stop.location;
    remainingTasks = remainingTasks.filter(t => !(t.id === nextTask!.id && t.type === nextTask!.type));
  }

  return { stops, totalDistanceKm: Math.round(totalDistance * 100) / 100 };
};
