
import { optimizeRoute, Task, Location } from './route.service';

describe('RouteService', () => {
  it('should optimize a simple pickup and delivery route with the same task ID', () => {
    const volunteerLocation: Location = { latitude: 0, longitude: 0 };
    const tasks: Task[] = [
      { id: 't1', type: 'PICKUP', pickupPoint: { latitude: 0.1, longitude: 0.1 } },
      { id: 't1', type: 'DELIVERY', deliveryLocation: { latitude: 0.2, longitude: 0.2 } }
    ];

    const result = optimizeRoute({ volunteerLocation, tasks });

    expect(result.stops.length).toBe(2);
    expect(result.stops[0].type).toBe('PICKUP');
    expect(result.stops[0].taskId).toBe('t1');
    expect(result.stops[1].type).toBe('DELIVERY');
    expect(result.stops[1].taskId).toBe('t1');
  });

  it('should optimize multiple pickup and delivery tasks maintaining pickup before delivery order', () => {
    const volunteerLocation: Location = { latitude: 0, longitude: 0 };
    const tasks: Task[] = [
      { id: 't2', type: 'DELIVERY', deliveryLocation: { latitude: 0.3, longitude: 0.3 } },
      { id: 't1', type: 'DELIVERY', deliveryLocation: { latitude: 0.15, longitude: 0.15 } },
      { id: 't1', type: 'PICKUP', pickupPoint: { latitude: 0.1, longitude: 0.1 } },
      { id: 't2', type: 'PICKUP', pickupPoint: { latitude: 0.2, longitude: 0.2 } }
    ];

    const result = optimizeRoute({ volunteerLocation, tasks });

    expect(result.stops.length).toBe(4);
    // Pickup t1 must happen before delivery t1
    const p1Index = result.stops.findIndex(s => s.taskId === 't1' && s.type === 'PICKUP');
    const d1Index = result.stops.findIndex(s => s.taskId === 't1' && s.type === 'DELIVERY');
    expect(p1Index).toBeLessThan(d1Index);

    // Pickup t2 must happen before delivery t2
    const p2Index = result.stops.findIndex(s => s.taskId === 't2' && s.type === 'PICKUP');
    const d2Index = result.stops.findIndex(s => s.taskId === 't2' && s.type === 'DELIVERY');
    expect(p2Index).toBeLessThan(d2Index);
  });
});
