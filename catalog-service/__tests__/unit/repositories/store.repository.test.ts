import { describe, it, expect, vi } from 'vitest';
import { Pool } from 'pg';
import { StoreRepository } from '../../../src/repositories/store.repository';

describe('StoreRepository', () => {
  let mockPool: any;
  let repo: StoreRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repo = new StoreRepository(mockPool as unknown as Pool);
  });

  describe('findById', () => {
    it('should return store when found', async () => {
      const mockStore = {
        id: 1,
        name: 'Store 1',
        location: 'Downtown',
        opening_time: '09:00',
        closing_time: '21:00',
        image: 'img.jpg',
        active: true,
        admin_id: 10,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockStore] });

      const result = await repo.findById(1);

      expect(result).toEqual(mockStore);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM stores WHERE id = $1'),
        [1]
      );
    });

    it('should return null when store not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAllActive', () => {
    it('should return all active stores', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1', active: true },
        { id: 2, name: 'Store 2', active: true },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockStores });

      const result = await repo.findAllActive();

      expect(result).toEqual(mockStores);
    });

    it('should return empty array when no active stores', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findAllActive();

      expect(result).toEqual([]);
    });
  });

  describe('findByAdminId', () => {
    it('should return stores for admin', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1', admin_id: 10 },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockStores });

      const result = await repo.findByAdminId(10);

      expect(result).toEqual(mockStores);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('admin_id = $1'),
        [10]
      );
    });

    it('should return empty array when admin has no stores', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findByAdminId(999);

      expect(result).toEqual([]);
    });
  });

  describe('searchByName', () => {
    it('should search stores by name', async () => {
      const mockStores = [
        { id: 1, name: 'Coffee Shop', active: true },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockStores });

      const result = await repo.searchByName('coffee');

      expect(result).toEqual(mockStores);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it('should return empty array when no stores match', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.searchByName('xyz123');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create store', async () => {
      const mockStore = {
        id: 1,
        name: 'New Store',
        location: 'Mall',
        opening_time: '10:00',
        closing_time: '22:00',
        image: 'img.jpg',
        active: true,
        admin_id: 5,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockStore] });

      const result = await repo.create({
        name: 'New Store',
        location: 'Mall',
        opening_time: '10:00',
        closing_time: '22:00',
        image: 'img.jpg',
        admin_id: 5,
      });

      expect(result).toEqual(mockStore);
    });
  });

  describe('update', () => {
    it('should update store with allowed fields', async () => {
      const mockStore = {
        id: 1,
        name: 'Updated Store',
        location: 'New Location',
        opening_time: '08:00',
        closing_time: '23:00',
        image: 'new-img.jpg',
        active: true,
        admin_id: 10,
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockStore] });

      const result = await repo.update(1, {
        name: 'Updated Store',
        location: 'New Location',
      });

      expect(result).toEqual(mockStore);
    });

    it('should return null when store not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.update(999, { name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete store', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 });

      const result = await repo.softDelete(1);

      expect(result).toBe(true);
    });

    it('should return false when store not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await repo.softDelete(999);

      expect(result).toBe(false);
    });
  });
});
