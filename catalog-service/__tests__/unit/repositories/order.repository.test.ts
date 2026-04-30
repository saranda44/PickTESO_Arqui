import { describe, it, expect, vi } from 'vitest';
import { Pool } from 'pg';
import { OrderRepository } from '../../../src/repositories/order.repository';

describe('OrderRepository', () => {
  let mockPool: any;
  let repo: OrderRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repo = new OrderRepository(mockPool as unknown as Pool);
  });

  describe('findByUserIdWithProducts', () => {
    it('should return orders with products for user', async () => {
      const mockResult = [
        {
          id: 1,
          user_id: 10,
          store_id: 20,
          total: 100,
          status: 'completed',
          created_at: new Date(),
          updated_at: new Date(),
          items: [
            { id: 100, product_id: 5, quantity: 2, unit_price: 50, name: 'Product 1' },
          ],
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockResult });

      const result = await repo.findByUserIdWithProducts(10);

      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $1'),
        [10]
      );
    });

    it('should return empty array when user has no orders', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findByUserIdWithProducts(999);

      expect(result).toEqual([]);
    });
  });
});
