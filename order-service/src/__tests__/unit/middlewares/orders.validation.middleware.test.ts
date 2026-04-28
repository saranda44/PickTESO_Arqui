import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validateRequest } from '../../../middlewares/orders.validation.middleware';

describe('Orders Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('validateRequest', () => {
    it('should call next when no validation errors', () => {
      req = { params: {}, body: {} };
      validateRequest(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
