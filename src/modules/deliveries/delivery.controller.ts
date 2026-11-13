import { DeliveryService } from './delivery.service';

export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  async assignDelivery(id: string, volunteerId: string) {
    return this.deliveryService.assignDelivery(id, volunteerId);
  }

  async verifyQr(deliveryId: string, type: 'PICKUP' | 'DELIVERY', code: string) {
    return this.deliveryService.verifyQrCode(deliveryId, type, code);
  }
}
