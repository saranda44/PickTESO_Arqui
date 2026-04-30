import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/repositories', () => ({
  default: {
    store: {
      findById: vi.fn(),
      findAllActive: vi.fn(),
      searchByName: vi.fn(),
    },
    product: {
      getProductsWithTags: vi.fn(),
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

describe('Stores E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /stores', () => {
    it('should return all active stores', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1', active: true },
        { id: 2, name: 'Store 2', active: true },
      ];
      (Repositories.store.findAllActive as any).mockResolvedValueOnce(mockStores);

      const res = await request(app).get('/stores');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStores);
    });

    it('should return empty array when no stores', async () => {
      (Repositories.store.findAllActive as any).mockResolvedValueOnce([]);

      const res = await request(app).get('/stores');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /stores/:id', () => {
    it('should return store by id', async () => {
      const mockStore = { id: 1, name: 'Store 1', active: true };
      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);

      const res = await request(app).get('/stores/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStore);
    });

    it('should return 404 when store not found', async () => {
      (Repositories.store.findById as any).mockResolvedValueOnce(null);

      const res = await request(app).get('/stores/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 when store is inactive', async () => {
      const mockStore = { id: 1, name: 'Store 1', active: false };
      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);

      const res = await request(app).get('/stores/1');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /stores/:storeId/products', () => {
    it('should return products for store with tags', async () => {
      const mockStore = { id: 10, name: 'Store 1', active: true };
      const mockProducts = [
        { id: 1, name: 'Product 1', tags: [] },
      ];
      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);
      (Repositories.product.getProductsWithTags as any).mockResolvedValueOnce(mockProducts);

      const res = await request(app).get('/stores/10/products');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockProducts);
    });

    it('should return 404 when store not found', async () => {
      (Repositories.store.findById as any).mockResolvedValueOnce(null);

      const res = await request(app).get('/stores/999/products');

      expect(res.status).toBe(404);
    });

    it('should return products even when store is inactive', async () => {
      const mockStore = { id: 10, name: 'Store 1', active: false };
      const mockProducts = [
        { id: 1, name: 'Product 1', tags: [] },
      ];
      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);
      (Repositories.product.getProductsWithTags as any).mockResolvedValueOnce(mockProducts);

      const res = await request(app).get('/stores/10/products');

      expect(res.status).toBe(200);
    });
  });
});
