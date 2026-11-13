import * as bcrypt from 'bcrypt';
import { DeliveryService } from './delivery.service';
import { prisma } from '../../shared/prisma';

jest.mock('../../shared/prisma', () => ({
  prisma: {
    delivery: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(() => {
    service = new DeliveryService();
    jest.clearAllMocks();
  });

  describe('assignDelivery', () => {
    it('should assign volunteer and generate code hashes', async () => {
      (prisma.delivery.update as jest.Mock).mockResolvedValue({
        id: 'del-1',
        volunteer_id: 'vol-1',
        status: 'ASSIGNED',
      });

      const result = await service.assignDelivery('del-1', 'vol-1');

      expect(prisma.delivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del-1' },
          data: expect.objectContaining({
            volunteer_id: 'vol-1',
            status: 'ASSIGNED',
          }),
        })
      );
      expect(result.status).toBe('ASSIGNED');
    });
  });

  describe('verifyQrCode', () => {
    it('should verify pickup code and update status to PICKED_UP', async () => {
      const code = '123456';
      const hash = await bcrypt.hash(code, 10);

      (prisma.delivery.findUnique as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'ASSIGNED',
        pickup_code_hash: hash,
        delivery_code_hash: hash,
      });

      (prisma.delivery.update as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'PICKED_UP',
      });

      const result = await service.verifyQrCode('del-1', 'PICKUP', code);

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'del-1' },
        data: expect.objectContaining({
          status: 'PICKED_UP',
          pickup_code_hash: null,
          delivery_code_hash: null,
        }),
      });
      expect(result.status).toBe('PICKED_UP');
    });

    it('should verify delivery code and update status to DELIVERED', async () => {
      const code = '654321';
      const hash = await bcrypt.hash(code, 10);

      (prisma.delivery.findUnique as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'PICKED_UP',
        pickup_code_hash: null,
        delivery_code_hash: hash,
      });

      (prisma.delivery.update as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'DELIVERED',
      });

      const result = await service.verifyQrCode('del-1', 'DELIVERY', code);

      expect(prisma.delivery.update).toHaveBeenCalledWith({
        where: { id: 'del-1' },
        data: expect.objectContaining({
          status: 'DELIVERED',
          pickup_code_hash: null,
          delivery_code_hash: null,
        }),
      });
      expect(result.status).toBe('DELIVERED');
    });

    it('should throw error if code does not match', async () => {
      const validCode = '123456';
      const hash = await bcrypt.hash(validCode, 10);

      (prisma.delivery.findUnique as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'ASSIGNED',
        pickup_code_hash: hash,
      });

      await expect(service.verifyQrCode('del-1', 'PICKUP', 'WRONG_CODE')).rejects.toThrow('Invalid code');
    });

    it('should throw error if delivery is not in ASSIGNED state for pickup', async () => {
      const code = '123456';
      const hash = await bcrypt.hash(code, 10);

      (prisma.delivery.findUnique as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'PENDING',
        pickup_code_hash: hash,
      });

      await expect(service.verifyQrCode('del-1', 'PICKUP', code)).rejects.toThrow('Delivery not in assignable state');
    });

    it('should throw error if delivery is not in PICKED_UP state for delivery', async () => {
      const code = '123456';
      const hash = await bcrypt.hash(code, 10);

      (prisma.delivery.findUnique as jest.Mock).mockResolvedValue({
        id: 'del-1',
        status: 'ASSIGNED',
        delivery_code_hash: hash,
      });

      await expect(service.verifyQrCode('del-1', 'DELIVERY', code)).rejects.toThrow('Delivery not in picked up state');
    });
  });
});
