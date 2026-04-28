import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole, AuthUser } from '../../../middlewares/auth.middleware';

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('authMiddleware', () => {
    it('should authenticate with valid headers', () => {
      req.headers = {
        'x-user-id': '123',
        'x-user-role': 'customer',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(req.user).toEqual({
        id: 123,
        role: 'customer',
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing userId header', () => {
      req.headers = {
        'x-user-role': 'customer',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized — missing auth headers',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing role header', () => {
      req.headers = {
        'x-user-id': '123',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized — missing auth headers',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid userId (not a number)', () => {
      req.headers = {
        'x-user-id': 'not-a-number',
        'x-user-role': 'customer',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized — invalid user id',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid role', () => {
      req.headers = {
        'x-user-id': '123',
        'x-user-role': 'invalid_role',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized — invalid role',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate store_admin role', () => {
      req.headers = {
        'x-user-id': '456',
        'x-user-role': 'store_admin',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(req.user).toEqual({
        id: 456,
        role: 'store_admin',
      });
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate platform_admin role', () => {
      req.headers = {
        'x-user-id': '789',
        'x-user-role': 'platform_admin',
      };

      authMiddleware(req as Request, res as Response, next);

      expect(req.user).toEqual({
        id: 789,
        role: 'platform_admin',
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access with valid role', () => {
      req.user = { id: 123, role: 'store_admin' };

      const middleware = requireRole('store_admin');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access with any of multiple valid roles', () => {
      req.user = { id: 123, role: 'platform_admin' };

      const middleware = requireRole('store_admin', 'platform_admin');
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject access with invalid role', () => {
      req.user = { id: 123, role: 'customer' };

      const middleware = requireRole('store_admin');
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden — insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject access when user is not authenticated', () => {
      req.user = undefined;

      const middleware = requireRole('store_admin');
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden — insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
