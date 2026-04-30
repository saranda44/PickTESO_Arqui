import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../../../src/services/product.service';
import { NotFoundError } from '../../../src/errors';

vi.mock('../../../src/repositories', () => ({
  default: {
    product: {
      findById: vi.fn(),
      getProductsWithTags: vi.fn(),
      findByIds: vi.fn(),
    },
    store: {
      findById: vi.fn(),
    },
  },
}));

import Repositories from '../../../src/repositories';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductService();
  });

  describe('getById', () => {
    it('should return product when found', async () => {
      const mockProduct = { id: 1, store_id: 10, name: 'Product 1' };
      (Repositories.product.findById as any).mockResolvedValueOnce(mockProduct);

      const result = await service.getById(1);

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundError when product not found', async () => {
      (Repositories.product.findById as any).mockResolvedValueOnce(null);

      await expect(service.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByStoreIdWithTags', () => {
    it('should return products with tags when store exists', async () => {
      const mockStore = { id: 10, name: 'Store 1', active: true };
      const mockProducts = [
        { id: 1, name: 'Product 1', tags: [] },
      ];

      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);
      (Repositories.product.getProductsWithTags as any).mockResolvedValueOnce(mockProducts);

      const result = await service.getByStoreIdWithTags(10);

      expect(result).toEqual(mockProducts);
    });

    it('should throw NotFoundError when store not found', async () => {
      (Repositories.store.findById as any).mockResolvedValueOnce(null);

      await expect(service.getByStoreIdWithTags(999)).rejects.toThrow(NotFoundError);
    });

  });

  describe('getByIds', () => {
    it('should return products by ids', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];
      (Repositories.product.findByIds as any).mockResolvedValueOnce(mockProducts);

      const result = await service.getByIds([1, 2]);

      expect(result).toEqual(mockProducts);
    });

    it('should return empty array when no products found', async () => {
      (Repositories.product.findByIds as any).mockResolvedValueOnce([]);

      const result = await service.getByIds([999, 998]);

      expect(result).toEqual([]);
    });
  });
});
