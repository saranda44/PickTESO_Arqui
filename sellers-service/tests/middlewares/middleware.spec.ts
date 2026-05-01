import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { NotFoundError, ForbiddenError, UnauthorizedError } from '../../src/errors';

const mockRepos = {
    store: { findById: vi.fn() },
    product: { findById: vi.fn() },
    tag: { findById: vi.fn() },
    inventory: { findById: vi.fn() },
};

vi.mock('../../src/repositories', () => ({ default: mockRepos }));

describe('Middlewares', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            headers: {},
            params: {},
            user: undefined,
        };
        mockRes = {};
        mockNext = vi.fn();
    });

    describe('userFromHeaders', () => {
        it('sets req.user when headers provided', async () => {
            const { userFromHeaders } = await import('../../src/middlewares/user-from-headers.middleware');
            mockReq.headers = {
                'x-user-id': '1',
                'x-user-role': 'admin',
                'x-store-id': '5',
            };

            userFromHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user).toEqual({
                id: 1,
                role: 'admin',
                storeId: 5,
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('sets storeId to null when not provided', async () => {
            const { userFromHeaders } = await import('../../src/middlewares/user-from-headers.middleware');
            mockReq.headers = {
                'x-user-id': '1',
                'x-user-role': 'user',
            };

            userFromHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user).toEqual({
                id: 1,
                role: 'user',
                storeId: null,
            });
            expect(mockNext).toHaveBeenCalled();
        });

        it('does not set req.user when no x-user-id', async () => {
            const { userFromHeaders } = await import('../../src/middlewares/user-from-headers.middleware');
            mockReq.headers = {};

            userFromHeaders(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('requireRole', () => {
        it('calls next when role matches', async () => {
            const { requireRole } = await import('../../src/middlewares/auth.middleware');
            mockReq.user = { id: 1, role: 'platform_admin', storeId: null };

            const middleware = requireRole('platform_admin', 'seller');
            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('throws ForbiddenError when role does not match', async () => {
            const { requireRole } = await import('../../src/middlewares/auth.middleware');
            mockReq.user = { id: 1, role: 'user', storeId: null };

            const middleware = requireRole('platform_admin');
            expect(() => {
                middleware(mockReq as Request, mockRes as Response, mockNext);
            }).toThrow(ForbiddenError);
        });

        it('throws UnauthorizedError when no user', async () => {
            const { requireRole } = await import('../../src/middlewares/auth.middleware');
            mockReq.user = undefined;

            const middleware = requireRole('platform_admin');
            expect(() => {
                middleware(mockReq as Request, mockRes as Response, mockNext);
            }).toThrow(UnauthorizedError);
        });
    });

    describe('ownsStore', () => {
        it('calls next when admin owns store', async () => {
            const { ownsStore } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 1 });

            const middleware = ownsStore((req) => Number(req.params.id));
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('calls next(NotFoundError) when store not found', async () => {
            const { ownsStore } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.store.findById.mockResolvedValue(null);

            const middleware = ownsStore((req) => Number(req.params.id));
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
        });

        it('calls next(ForbiddenError) when admin does not own store', async () => {
            const { ownsStore } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 2 });

            const middleware = ownsStore((req) => Number(req.params.id));
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });
    });

    describe('ownsProduct', () => {
        it('calls next when admin owns product', async () => {
            const { ownsProduct } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.product.findById.mockResolvedValue({ id: 1, store_id: 1 });
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 1 });

            const middleware = ownsProduct((req) => Number(req.params.id));
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('calls next(NotFoundError) when product not found', async () => {
            const { ownsProduct } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.product.findById.mockResolvedValue(null);

            const middleware = ownsProduct((req) => Number(req.params.id));
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
        });

        it('calls next(ForbiddenError) when admin does not own product', async () => {
            const { ownsProduct } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.product.findById.mockResolvedValue({ id: 1, store_id: 1 });
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 2 });

            const middleware = ownsProduct((req) => Number(req.params.id));
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });
    });

    describe('ownsTag', () => {
        it('calls next when admin owns tag', async () => {
            const { ownsTag } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.tag.findById.mockResolvedValue({ id: 1, store_id: 1 });
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 1 });

            await ownsTag(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('calls next(NotFoundError) when tag not found', async () => {
            const { ownsTag } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.tag.findById.mockResolvedValue(null);

            await ownsTag(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
        });

        it('calls next(ForbiddenError) when admin does not own tag', async () => {
            const { ownsTag } = await import('../../src/middlewares/ownership.middleware');
            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.tag.findById.mockResolvedValue({ id: 1, store_id: 1 });
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 2 });

            await ownsTag(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
        });
    });

    describe('errorMiddleware', () => {
        it('returns AppError status code for known errors', async () => {
            const { errorMiddleware } = await import('../../src/middlewares/error.middleware');
            const err = new NotFoundError('Not found');
            const res: any = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'NotFoundError',
                message: 'Not found',
            });
        });

        it('returns 500 for generic errors', async () => {
            const { errorMiddleware } = await import('../../src/middlewares/error.middleware');
            const err = new Error('Unknown error');
            const res: any = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: 'InternalServerError',
                message: 'Error interno del servidor',
            });
        });

        it('handles ForbiddenError with 403', async () => {
            const { errorMiddleware } = await import('../../src/middlewares/error.middleware');
            const err = new ForbiddenError('Forbidden');
            const res: any = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: 'ForbiddenError',
                message: 'Forbidden',
            });
        });
    });
});
