import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { userFromHeaders } from '../../../src/middlewares/user-from-headers.middleware';

describe('User From Headers Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = vi.fn();
  });

  it('should set user when all headers present', () => {
    req.headers = {
      'x-user-id': '123',
      'x-user-role': 'customer',
      'x-store-id': '456',
    };

    userFromHeaders(req as Request, res as Response, next);

    expect(req.user).toEqual({
      id: 123,
      role: 'customer',
      storeId: 456,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should set user without store id if x-store-id missing', () => {
    req.headers = {
      'x-user-id': '123',
      'x-user-role': 'customer',
    };

    userFromHeaders(req as Request, res as Response, next);

    expect(req.user).toEqual({
      id: 123,
      role: 'customer',
      storeId: null,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should not set user when x-user-id missing', () => {
    req.headers = {
      'x-user-role': 'customer',
    };

    userFromHeaders(req as Request, res as Response, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should set user for store_admin role with store id', () => {
    req.headers = {
      'x-user-id': '100',
      'x-user-role': 'store_admin',
      'x-store-id': '789',
    };

    userFromHeaders(req as Request, res as Response, next);

    expect(req.user).toEqual({
      id: 100,
      role: 'store_admin',
      storeId: 789,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should set user for platform_admin role', () => {
    req.headers = {
      'x-user-id': '200',
      'x-user-role': 'platform_admin',
    };

    userFromHeaders(req as Request, res as Response, next);

    expect(req.user).toEqual({
      id: 200,
      role: 'platform_admin',
      storeId: null,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should always call next', () => {
    req.headers = {};

    userFromHeaders(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });
});
