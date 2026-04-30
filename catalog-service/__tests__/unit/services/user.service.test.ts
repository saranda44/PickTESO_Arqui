import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../src/services/user.service';

vi.mock('../../../src/repositories', () => ({
  default: {
    user: {
      findById: vi.fn(),
    },
  },
}));

import Repositories from '../../../src/repositories';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 1, first_name: 'John', email: 'john@example.com' };
      (Repositories.user.findById as any).mockResolvedValueOnce(mockUser);

      const result = await service.getUserById(1);

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      (Repositories.user.findById as any).mockResolvedValueOnce(null);

      const result = await service.getUserById(999);

      expect(result).toBeNull();
    });
  });
});
