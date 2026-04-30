import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../../../src/middlewares/error.middleware';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
  InternalServerError,
} from '../../../src/errors';

describe('Error Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('Resource not found');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'NotFoundError',
      message: 'Resource not found',
    });
  });

  it('should handle BadRequestError', () => {
    const error = new BadRequestError('Invalid input');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'BadRequestError',
      message: 'Invalid input',
    });
  });

  it('should handle ForbiddenError', () => {
    const error = new ForbiddenError('Access denied');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'ForbiddenError',
      message: 'Access denied',
    });
  });

  it('should handle UnauthorizedError', () => {
    const error = new UnauthorizedError('Unauthorized');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'UnauthorizedError',
      message: 'Unauthorized',
    });
  });

  it('should handle generic Error as 500', () => {
    const error = new Error('Something went wrong');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      message: 'Error interno del servidor',
    });
  });
});
