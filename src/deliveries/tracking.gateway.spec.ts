import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server, Socket } from 'socket.io';
import { TrackingGateway } from './tracking.gateway.js';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let mockServer: {
    to: ReturnType<typeof vi.fn>;
  };
  let mockEmit: ReturnType<typeof vi.fn>;
  let mockSocket: {
    id: string;
    join: ReturnType<typeof vi.fn>;
    leave: ReturnType<typeof vi.fn>;
    handshake: {
      query: Record<string, string>;
      auth: Record<string, string>;
    };
  };

  beforeEach(() => {
    gateway = new TrackingGateway();

    mockEmit = vi.fn();
    mockServer = {
      to: vi.fn().mockReturnValue({ emit: mockEmit }),
    };
    gateway.server = mockServer as unknown as Server;

    mockSocket = {
      id: 'socket-client-123',
      join: vi.fn(),
      leave: vi.fn(),
      handshake: {
        query: {},
        auth: {},
      },
    };
  });

  describe('Lifecycle & Initialization', () => {
    it('initializes successfully on afterInit', () => {
      expect(() => gateway.afterInit()).not.toThrow();
    });

    it('handles client connection without initial room if deliveryId is missing', async () => {
      await gateway.handleConnection(mockSocket as unknown as Socket);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('auto-joins room on connection when deliveryId is in handshake query', async () => {
      mockSocket.handshake.query = { deliveryId: 'delivery-uuid-999' };
      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(mockSocket.join).toHaveBeenCalledWith('delivery:delivery-uuid-999');
      expect(mockSocket.join).toHaveBeenCalledWith('delivery-uuid-999');
    });

    it('auto-joins room on connection when deliveryId is in handshake auth', async () => {
      mockSocket.handshake.auth = { deliveryId: 'delivery-uuid-888' };
      await gateway.handleConnection(mockSocket as unknown as Socket);

      expect(mockSocket.join).toHaveBeenCalledWith('delivery:delivery-uuid-888');
      expect(mockSocket.join).toHaveBeenCalledWith('delivery-uuid-888');
    });

    it('handles client disconnection gracefully', () => {
      expect(() => gateway.handleDisconnect(mockSocket as unknown as Socket)).not.toThrow();
    });
  });

  describe('Room Subscription & Unsubscription', () => {
    it('subscribes a client to a delivery room with an object payload', async () => {
      const res = await gateway.handleJoinDelivery(mockSocket as unknown as Socket, {
        deliveryId: 'delivery-abc-123',
      });

      expect(mockSocket.join).toHaveBeenCalledWith('delivery:delivery-abc-123');
      expect(mockSocket.join).toHaveBeenCalledWith('delivery-abc-123');
      expect(res).toEqual({
        event: 'joined',
        room: 'delivery:delivery-abc-123',
        deliveryId: 'delivery-abc-123',
      });
    });

    it('subscribes a client to a delivery room with a raw string payload', async () => {
      const res = await gateway.handleJoinDelivery(
        mockSocket as unknown as Socket,
        'delivery-abc-123',
      );

      expect(mockSocket.join).toHaveBeenCalledWith('delivery:delivery-abc-123');
      expect(mockSocket.join).toHaveBeenCalledWith('delivery-abc-123');
      expect(res).toEqual({
        event: 'joined',
        room: 'delivery:delivery-abc-123',
        deliveryId: 'delivery-abc-123',
      });
    });

    it('returns an error if join payload is empty or missing deliveryId', async () => {
      const res = await gateway.handleJoinDelivery(
        mockSocket as unknown as Socket,
        null as unknown as string,
      );

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(res).toEqual({
        success: false,
        error: 'deliveryId is required',
      });
    });

    it('unsubscribes a client from a delivery room with an object payload', async () => {
      const res = await gateway.handleLeaveDelivery(mockSocket as unknown as Socket, {
        deliveryId: 'delivery-abc-123',
      });

      expect(mockSocket.leave).toHaveBeenCalledWith('delivery:delivery-abc-123');
      expect(mockSocket.leave).toHaveBeenCalledWith('delivery-abc-123');
      expect(res).toEqual({
        event: 'left',
        room: 'delivery:delivery-abc-123',
        deliveryId: 'delivery-abc-123',
      });
    });

    it('unsubscribes a client from a delivery room with a raw string payload', async () => {
      const res = await gateway.handleLeaveDelivery(
        mockSocket as unknown as Socket,
        'delivery-abc-123',
      );

      expect(mockSocket.leave).toHaveBeenCalledWith('delivery:delivery-abc-123');
      expect(mockSocket.leave).toHaveBeenCalledWith('delivery-abc-123');
      expect(res).toEqual({
        event: 'left',
        room: 'delivery:delivery-abc-123',
        deliveryId: 'delivery-abc-123',
      });
    });

    it('returns an error if leave payload is empty or missing deliveryId', async () => {
      const res = await gateway.handleLeaveDelivery(
        mockSocket as unknown as Socket,
        undefined as unknown as string,
      );

      expect(mockSocket.leave).not.toHaveBeenCalled();
      expect(res).toEqual({
        success: false,
        error: 'deliveryId is required',
      });
    });
  });

  describe('Event Broadcasting', () => {
    it('broadcasts live location updates to delivery room subscribers', () => {
      const eta = new Date('2026-11-13T19:30:00.000Z');
      const payload = {
        latitude: 37.7749,
        longitude: -122.4194,
        estimatedArrivalAt: eta,
        status: 'IN_TRANSIT',
      };

      const result = gateway.broadcastLocationUpdate('delivery-xyz-777', payload);

      expect(mockServer.to).toHaveBeenCalledWith('delivery:delivery-xyz-777');
      expect(mockServer.to).toHaveBeenCalledWith('delivery-xyz-777');
      expect(mockEmit).toHaveBeenCalledWith(
        'locationUpdate',
        expect.objectContaining({
          deliveryId: 'delivery-xyz-777',
          latitude: 37.7749,
          longitude: -122.4194,
          estimatedArrivalAt: eta,
          status: 'IN_TRANSIT',
          timestamp: expect.any(String),
        }),
      );
      expect(result.deliveryId).toBe('delivery-xyz-777');
      expect(result.latitude).toBe(37.7749);
    });

    it('broadcasts location update gracefully even when server instance is not yet bound', () => {
      gateway.server = undefined as any;

      expect(() =>
        gateway.broadcastLocationUpdate('delivery-xyz-777', {
          latitude: 37.7749,
          longitude: -122.4194,
          estimatedArrivalAt: null,
          status: 'IN_TRANSIT',
        }),
      ).not.toThrow();
    });

    it('broadcasts status updates to delivery room subscribers', () => {
      const res = gateway.broadcastStatusUpdate('delivery-xyz-777', 'PICKED_UP', {
        note: 'Courier on the way',
      });

      expect(mockServer.to).toHaveBeenCalledWith('delivery:delivery-xyz-777');
      expect(mockEmit).toHaveBeenCalledWith(
        'statusUpdate',
        expect.objectContaining({
          deliveryId: 'delivery-xyz-777',
          status: 'PICKED_UP',
          metadata: { note: 'Courier on the way' },
          timestamp: expect.any(String),
        }),
      );
      expect(res.status).toBe('PICKED_UP');
    });

    it('handles direct client location update socket message and broadcasts it', () => {
      const broadcastSpy = vi.spyOn(gateway, 'broadcastLocationUpdate');

      const res = gateway.handleUpdateLocation(mockSocket as unknown as Socket, {
        deliveryId: 'delivery-123',
        latitude: 40.7128,
        longitude: -74.006,
        estimatedArrivalAt: '2026-11-13T20:00:00.000Z',
        status: 'IN_TRANSIT',
      });

      expect(broadcastSpy).toHaveBeenCalledWith('delivery-123', {
        latitude: 40.7128,
        longitude: -74.006,
        estimatedArrivalAt: new Date('2026-11-13T20:00:00.000Z'),
        status: 'IN_TRANSIT',
      });
      expect(res).toEqual({ event: 'locationUpdated', success: true });
    });

    it('rejects client updateLocation message with invalid coordinates or missing deliveryId', () => {
      const broadcastSpy = vi.spyOn(gateway, 'broadcastLocationUpdate');

      const res = gateway.handleUpdateLocation(mockSocket as unknown as Socket, {
        deliveryId: '',
        latitude: null as any,
        longitude: null as any,
      });

      expect(broadcastSpy).not.toHaveBeenCalled();
      expect(res).toEqual({
        success: false,
        error: 'deliveryId, latitude, and longitude are required',
      });
    });
  });

  describe('Observable Stream for Server-Sent Events (SSE)', () => {
    it('emits location updates matching the target deliveryId and filters out other deliveries', () => {
      const receivedEvents: any[] = [];
      const sub = gateway
        .getLocationStream('target-delivery')
        .subscribe((event) => receivedEvents.push(event));

      gateway.broadcastLocationUpdate('other-delivery', {
        latitude: 10,
        longitude: 20,
        estimatedArrivalAt: null,
        status: 'IN_TRANSIT',
      });

      gateway.broadcastLocationUpdate('target-delivery', {
        latitude: 37.7749,
        longitude: -122.4194,
        estimatedArrivalAt: null,
        status: 'IN_TRANSIT',
      });

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].data.deliveryId).toBe('target-delivery');
      expect(receivedEvents[0].data.latitude).toBe(37.7749);

      sub.unsubscribe();
    });
  });
});
