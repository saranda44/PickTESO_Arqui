import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorMiddleware } from '../../../src/middlewares/error.middleware';
import { BadRequestError, NotFoundError, InternalServerError } from '../../../src/errors';

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
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle BadRequestError with 400 status', () => {
    const error = new BadRequestError('Invalid request');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'BadRequestError',
      message: 'Invalid request',
    });
  });

  it('should handle NotFoundError with 404 status', () => {
    const error = new NotFoundError('Resource not found');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'NotFoundError',
      message: 'Resource not found',
    });
  });

  it('should handle InternalServerError with 500 status', () => {
    const error = new InternalServerError('Server error');

    errorMiddleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      message: 'Server error',
    });
  });

  it('should handle unknown errors with 500 status and generic message', () => {
    const error = new Error('Some unknown error');

    errorMiddleware(error as any, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      message: 'Error interno del servidor',
    });
  });

  it('should handle undefined error with 500 status', () => {
    errorMiddleware(undefined as any, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      message: 'Error interno del servidor',
    });
  });
});
