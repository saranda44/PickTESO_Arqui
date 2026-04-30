import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreService } from '../../../src/services/store.services';
import { NotFoundError } from '../../../src/errors';

vi.mock('../../../src/repositories', () => ({
  default: {
    store: {
      findById: vi.fn(),
      findAllActive: vi.fn(),
      searchByName: vi.fn(),
    },
  },
}));

import Repositories from '../../../src/repositories';

describe('StoreService', () => {
  let service: StoreService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StoreService();
  });

  describe('getAllStores', () => {
    it('should return all active stores', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1', active: true },
        { id: 2, name: 'Store 2', active: true },
      ];
      (Repositories.store.findAllActive as any).mockResolvedValueOnce(mockStores);

      const result = await service.getAllStores();

      expect(result).toEqual(mockStores);
    });

    it('should return empty array when no active stores', async () => {
      (Repositories.store.findAllActive as any).mockResolvedValueOnce([]);

      const result = await service.getAllStores();

      expect(result).toEqual([]);
    });
  });

  describe('getStoreById', () => {
    it('should return store when found and active', async () => {
      const mockStore = { id: 1, name: 'Store 1', active: true };
      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);

      const result = await service.getStoreById(1);

      expect(result).toEqual(mockStore);
    });

    it('should throw NotFoundError when store not found', async () => {
      (Repositories.store.findById as any).mockResolvedValueOnce(null);

      await expect(service.getStoreById(999)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when store is inactive', async () => {
      const mockStore = { id: 1, name: 'Store 1', active: false };
      (Repositories.store.findById as any).mockResolvedValueOnce(mockStore);

      await expect(service.getStoreById(1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('searchStores', () => {
    it('should return all stores when query is empty', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1' },
        { id: 2, name: 'Store 2' },
      ];
      (Repositories.store.findAllActive as any).mockResolvedValueOnce(mockStores);

      const result = await service.searchStores('');

      expect(result).toEqual(mockStores);
    });

    it('should search stores by name when query is provided', async () => {
      const mockStores = [
        { id: 1, name: 'Coffee Shop' },
      ];
      (Repositories.store.searchByName as any).mockResolvedValueOnce(mockStores);

      const result = await service.searchStores('coffee');

      expect(result).toEqual(mockStores);
      expect(Repositories.store.searchByName).toHaveBeenCalledWith('coffee');
    });

    it('should return empty array when no matches', async () => {
      (Repositories.store.searchByName as any).mockResolvedValueOnce([]);

      const result = await service.searchStores('xyz123');

      expect(result).toEqual([]);
    });
  });
});
