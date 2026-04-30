import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../../../src/services/orders.service';

vi.mock('../../../src/repositories', () => ({
  default: {
    order: {
      findByUserIdWithProducts: vi.fn(),
    },
  },
}));

import Repositories from '../../../src/repositories';

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrdersByUser', () => {
    it('should return orders for user', async () => {
      const mockOrders = [
        { id: 1, user_id: 10, total: 100 },
      ];
      (Repositories.order.findByUserIdWithProducts as any).mockResolvedValueOnce(mockOrders);

      const result = await OrderService.getOrdersByUser(10) as any;

      expect(result).toEqual(mockOrders);
    });

    it('should return empty array when user has no orders', async () => {
      (Repositories.order.findByUserIdWithProducts as any).mockResolvedValueOnce([]);

      const result = await OrderService.getOrdersByUser(999) as any;

      expect(result).toEqual([]);
    });
  });
});
