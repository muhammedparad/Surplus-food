import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';

export interface DeliveryLocationPayload {
  latitude: number;
  longitude: number;
  estimatedArrivalAt: Date | null;
  status: string;
}

export interface DeliveryLocationEvent extends DeliveryLocationPayload {
  deliveryId: string;
  timestamp: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tracking',
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private readonly locationStream$ = new Subject<DeliveryLocationEvent>();

  afterInit(_server?: Server) {
    this.logger.log('Tracking WebSocket Gateway initialized on namespace /tracking');
  }

  async handleConnection(client: Socket) {
    const queryDeliveryId = client.handshake?.query?.deliveryId as string | undefined;
    const authDeliveryId = client.handshake?.auth?.deliveryId as string | undefined;
    const deliveryId = queryDeliveryId || authDeliveryId;

    if (deliveryId) {
      const room = `delivery:${deliveryId}`;
      await client.join(room);
      await client.join(deliveryId);
      this.logger.log(`Client ${client.id} joined tracking room: ${room}`);
    } else {
      this.logger.log(`Client connected to tracking gateway: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from tracking gateway: ${client.id}`);
  }

  @SubscribeMessage('joinDelivery')
  async handleJoinDelivery(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { deliveryId: string } | string,
  ) {
    const deliveryId = typeof payload === 'string' ? payload : payload?.deliveryId;
    if (!deliveryId) {
      return { success: false, error: 'deliveryId is required' };
    }

    const room = `delivery:${deliveryId}`;
    await client.join(room);
    await client.join(deliveryId);
    this.logger.log(`Client ${client.id} subscribed to room ${room}`);

    return { event: 'joined', room, deliveryId };
  }

  @SubscribeMessage('leaveDelivery')
  async handleLeaveDelivery(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { deliveryId: string } | string,
  ) {
    const deliveryId = typeof payload === 'string' ? payload : payload?.deliveryId;
    if (!deliveryId) {
      return { success: false, error: 'deliveryId is required' };
    }

    const room = `delivery:${deliveryId}`;
    await client.leave(room);
    await client.leave(deliveryId);
    this.logger.log(`Client ${client.id} left room ${room}`);

    return { event: 'left', room, deliveryId };
  }

  @SubscribeMessage('updateLocation')
  handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      deliveryId: string;
      latitude: number;
      longitude: number;
      estimatedArrivalAt?: Date | string | null;
      status?: string;
    },
  ) {
    if (!payload?.deliveryId || payload.latitude == null || payload.longitude == null) {
      return { success: false, error: 'deliveryId, latitude, and longitude are required' };
    }

    const arrivalDate = payload.estimatedArrivalAt
      ? new Date(payload.estimatedArrivalAt)
      : null;

    this.broadcastLocationUpdate(payload.deliveryId, {
      latitude: payload.latitude,
      longitude: payload.longitude,
      estimatedArrivalAt: arrivalDate,
      status: payload.status ?? 'IN_TRANSIT',
    });

    return { event: 'locationUpdated', success: true };
  }

  broadcastLocationUpdate(
    deliveryId: string,
    payload: {
      latitude: number;
      longitude: number;
      estimatedArrivalAt: Date | null;
      status: string;
    },
  ): DeliveryLocationEvent {
    const event: DeliveryLocationEvent = {
      deliveryId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      estimatedArrivalAt: payload.estimatedArrivalAt,
      status: payload.status,
      timestamp: new Date().toISOString(),
    };

    if (this.server) {
      this.server.to(`delivery:${deliveryId}`).emit('locationUpdate', event);
      this.server.to(deliveryId).emit('locationUpdate', event);
    }

    this.locationStream$.next(event);
    return event;
  }

  broadcastStatusUpdate(
    deliveryId: string,
    status: string,
    metadata?: Record<string, unknown>,
  ) {
    const event = {
      deliveryId,
      status,
      metadata,
      timestamp: new Date().toISOString(),
    };

    if (this.server) {
      this.server.to(`delivery:${deliveryId}`).emit('statusUpdate', event);
      this.server.to(deliveryId).emit('statusUpdate', event);
    }

    return event;
  }

  getLocationStream(deliveryId: string): Observable<{ data: DeliveryLocationEvent }> {
    return this.locationStream$.asObservable().pipe(
      filter((event) => event.deliveryId === deliveryId),
      map((event) => ({ data: event })),
    );
  }
}
