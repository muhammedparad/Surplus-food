import * as bcrypt from 'bcrypt';
import { prisma } from '../../shared/prisma';

const SALT_ROUNDS = 10;

export class DeliveryService {
  async assignDelivery(deliveryId: string, volunteerId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeWithSalt = code;
    const pickupHash = await bcrypt.hash(codeWithSalt, SALT_ROUNDS);
    const deliveryHash = await bcrypt.hash(codeWithSalt, SALT_ROUNDS);
    
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        volunteer_id: volunteerId,
        status: 'ASSIGNED',
        assigned_at: new Date(),
        pickup_code_hash: pickupHash,
        delivery_code_hash: deliveryHash,
      },
    });
  }

  async verifyQrCode(deliveryId: string, type: 'PICKUP' | 'DELIVERY', code: string) {
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new Error('Delivery not found');

    const hash = type === 'PICKUP' ? delivery.pickup_code_hash : delivery.delivery_code_hash;
    if (!hash) throw new Error('Code not set for this delivery');

    const match = await bcrypt.compare(code, hash);
    if (!match) throw new Error('Invalid code');

    if (type === 'PICKUP' && delivery.status !== 'ASSIGNED') {
      throw new Error('Delivery not in assignable state');
    }
    if (type === 'DELIVERY' && delivery.status !== 'PICKED_UP') {
      throw new Error('Delivery not in picked up state');
    }

    const updateData: any = {
      pickup_code_hash: null,
      delivery_code_hash: null,
    };

    if (type === 'PICKUP') {
      updateData.status = 'PICKED_UP';
      updateData.picked_up_at = new Date();
    } else {
      updateData.status = 'DELIVERED';
      updateData.delivered_at = new Date();
    }

    return prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });
  }
}
