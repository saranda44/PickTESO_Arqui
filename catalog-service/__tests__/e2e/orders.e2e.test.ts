import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/repositories', () => ({
  default: {
    order: {
      findByUserIdWithProducts: vi.fn(),
    },
  },
}));

vi.mock('../../src/config/db.config', () => {
  const mockQuery = vi.fn().mockResolvedValue({ rows: [{}] });
  return {
    default: new Proxy({}, {
      get: () => mockQuery,
    }),
  };
});

import app from '../../src/app';
import Repositories from '../../src/repositories';

describe('Orders E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /orders', () => {
    it('should return user orders with valid x-user-id header', async () => {
      const mockOrders = [
        { id: 1, user_id: 10, total: 100 },
      ];
      (Repositories.order.findByUserIdWithProducts as any).mockResolvedValueOnce(mockOrders);

      const res = await request(app)
        .get('/orders')
        .set('x-user-id', '10')
        .set('x-user-role', 'customer');

      expect(res.status).toBe(200);
      expect(res.body.orders).toEqual(mockOrders);
    });

    it('should return 500 when x-user-id header missing', async () => {
      const res = await request(app)
        .get('/orders')
        .set('x-user-role', 'customer');

      expect(res.status).toBe(500);
    });

    it('should return empty array when user has no orders', async () => {
      (Repositories.order.findByUserIdWithProducts as any).mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/orders')
        .set('x-user-id', '999')
        .set('x-user-role', 'customer');

      expect(res.status).toBe(200);
      expect(res.body.orders).toEqual([]);
    });
  });
});
