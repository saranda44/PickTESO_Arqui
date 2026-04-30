import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/repositories', () => ({
  default: {
    product: {
      findById: vi.fn(),
      findByIds: vi.fn(),
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

describe('Products E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /products/:id', () => {
    it('should return product by id', async () => {
      const mockProduct = { id: 1, store_id: 10, name: 'Product 1' };
      (Repositories.product.findById as any).mockResolvedValueOnce(mockProduct);

      const res = await request(app).get('/products/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockProduct);
    });

    it('should return 404 when product not found', async () => {
      (Repositories.product.findById as any).mockResolvedValueOnce(null);

      const res = await request(app).get('/products/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

});
