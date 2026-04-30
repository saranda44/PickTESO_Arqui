import { describe, it, expect, vi } from 'vitest';
import { Pool } from 'pg';
import { UserRepository } from '../../../src/repositories/user.repository';

describe('UserRepository', () => {
  let mockPool: any;
  let repo: UserRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repo = new UserRepository(mockPool as unknown as Pool);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 1,
        first_name: 'John',
        paternal_last_name: 'Doe',
        maternal_last_name: 'Smith',
        email: 'john@example.com',
        role: 'customer',
        profile_image: 'img.jpg',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await repo.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1'),
        [1]
      );
    });

    it('should return null when user not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });
  });
});
