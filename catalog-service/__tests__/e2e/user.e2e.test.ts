import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/repositories', () => ({
  default: {
    user: {
      findById: vi.fn(),
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

describe('User E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /user', () => {
    it('should return user with valid x-user-id header', async () => {
      const mockUser = { id: 1, first_name: 'John', email: 'john@example.com' };
      (Repositories.user.findById as any).mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .get('/user')
        .set('x-user-id', '1')
        .set('x-user-role', 'customer');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
    });

    it('should return 500 when x-user-id header missing', async () => {
      const res = await request(app)
        .get('/user')
        .set('x-user-role', 'customer');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
    });
  });
});
