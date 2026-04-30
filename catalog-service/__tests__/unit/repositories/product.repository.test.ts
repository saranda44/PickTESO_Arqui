import { describe, it, expect, vi } from 'vitest';
import { Pool } from 'pg';
import { ProductRepository } from '../../../src/repositories/product.repository';

describe('ProductRepository', () => {
  let mockPool: any;
  let repo: ProductRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repo = new ProductRepository(mockPool as unknown as Pool);
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: 1,
        store_id: 10,
        name: 'Product 1',
        description: 'Desc',
        price: 100,
        product_image: 'img.jpg',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const result = await repo.findById(1);

      expect(result).toEqual(mockProduct);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM products WHERE id = $1'),
        [1]
      );
    });

    it('should return null when product not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should return products by ids', async () => {
      const mockProducts = [
        { id: 1, store_id: 10, name: 'Product 1' },
        { id: 2, store_id: 10, name: 'Product 2' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockProducts });

      const result = await repo.findByIds([1, 2]);

      expect(result).toEqual(mockProducts);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return empty array when no products found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findByIds([999, 998]);

      expect(result).toEqual([]);
    });
  });

  describe('findByStoreId', () => {
    it('should return products for store', async () => {
      const mockProducts = [
        { id: 1, store_id: 10, name: 'Product 1' },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockProducts });

      const result = await repo.findByStoreId(10);

      expect(result).toEqual(mockProducts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('store_id = $1'),
        [10]
      );
    });

    it('should return empty array for store with no products', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findByStoreId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getProductsWithTags', () => {
    it('should return products with tags', async () => {
      const mockResults = [
        {
          id: 1,
          store_id: 10,
          name: 'Product 1',
          tags: [{ id: 100, name: 'Tag1', color: '#fff' }],
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockResults });

      const result = await repo.getProductsWithTags(10);

      expect(result).toEqual(mockResults);
    });

    it('should return empty array when store has no products', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.getProductsWithTags(999);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const mockProduct = {
        id: 1,
        store_id: 10,
        name: 'New Product',
        description: 'Desc',
        price: 50,
        product_image: 'img.jpg',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const result = await repo.create({
        store_id: 10,
        name: 'New Product',
        description: 'Desc',
        price: 50,
        product_image: 'img.jpg',
      });

      expect(result).toEqual(mockProduct);
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update product with allowed fields', async () => {
      const mockProduct = {
        id: 1,
        store_id: 10,
        name: 'Updated Product',
        description: 'Updated',
        price: 75,
        product_image: 'new-img.jpg',
        active: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const result = await repo.update(1, {
        name: 'Updated Product',
        description: 'Updated',
        price: 75,
      });

      expect(result).toEqual(mockProduct);
    });

    it('should return null when product not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.update(999, { name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete product', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await repo.delete(1);

      expect(result).toBe(true);
    });

    it('should return false when product not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await repo.delete(999);

      expect(result).toBe(false);
    });
  });
});
