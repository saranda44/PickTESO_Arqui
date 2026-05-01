import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockRepos = {
    store: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), softDelete: vi.fn(), findByAdminId: vi.fn() },
    product: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findByStoreId: vi.fn(), getProductsWithTags: vi.fn() },
    tag: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), softDelete: vi.fn(), findAllByStoreId: vi.fn() },
    inventory: { findById: vi.fn(), create: vi.fn(), delete: vi.fn(), findEntriesByProductId: vi.fn(), findStockByProductId: vi.fn() },
    productTag: { replaceMany: vi.fn(), findTagsByProductId: vi.fn() },
    user: { exists: vi.fn() },
};

vi.mock('../src/repositories', () => ({ default: mockRepos }));
vi.mock('../src/services/s3.service', () => ({ uploadImageToS3: vi.fn(), deleteImageFromS3: vi.fn() }));

describe('Edge Cases', () => {
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
        mockReq = {
            params: {},
            body: {},
            headers: {},
            user: { id: 1, role: 'admin', storeId: null },
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        mockNext = vi.fn();
    });

    describe('Error boundary code paths', () => {
        it('handles UnauthorizedError in error middleware', async () => {
            const { UnauthorizedError } = await import('../src/errors');
            const { errorMiddleware } = await import('../src/middlewares/error.middleware');
            const err = new UnauthorizedError('No auth');
            const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('handles BadRequestError in error middleware', async () => {
            const { BadRequestError } = await import('../src/errors');
            const { errorMiddleware } = await import('../src/middlewares/error.middleware');
            const err = new BadRequestError('Bad');
            const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('handles ConflictError in error middleware', async () => {
            const { ConflictError } = await import('../src/errors');
            const { errorMiddleware } = await import('../src/middlewares/error.middleware');
            const err = new ConflictError('Conflict');
            const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('handles InternalServerError in error middleware', async () => {
            const { InternalServerError } = await import('../src/errors');
            const { errorMiddleware } = await import('../src/middlewares/error.middleware');
            const err = new InternalServerError('Server error');
            const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            errorMiddleware(err, mockReq as Request, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Service validation paths', () => {
        it('validates opening_time format in store update', async () => {
            const { StoreService } = await import('../src/services/store.service');
            const svc = new StoreService();

            mockRepos.store.findById.mockResolvedValue({ id: 1 });

            await expect(svc.updateStore(1, { opening_time: 'invalid' })).rejects.toThrow();
        });

        it('validates closing_time format in store update', async () => {
            const { StoreService } = await import('../src/services/store.service');
            const svc = new StoreService();

            mockRepos.store.findById.mockResolvedValue({ id: 1 });

            await expect(svc.updateStore(1, { closing_time: 'invalid' })).rejects.toThrow();
        });

        it('validates opening_time >= closing_time constraint', async () => {
            const { StoreService } = await import('../src/services/store.service');
            const svc = new StoreService();

            mockRepos.store.findById.mockResolvedValue({ id: 1 });

            await expect(
                svc.updateStore(1, { opening_time: '18:00', closing_time: '09:00' })
            ).rejects.toThrow();
        });

        it('inventory succeeds with positive quantity', async () => {
            const { InventoryService } = await import('../src/services/inventory.service');
            const svc = new InventoryService();

            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.create.mockResolvedValue({ id: 1, product_id: 1, movement_type: 'in', quantity: 5 });

            const res = await svc.createInventoryEntry({ product_id: 1, movement_type: 'in', quantity: 5 });

            expect(res.id).toBe(1);
        });
    });

    describe('Service tag validation', () => {
        it('succeeds with valid tag_ids', async () => {
            const { ProductTagService } = await import('../src/services/productTag.service');
            const svc = new ProductTagService();

            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.tag.findById.mockResolvedValue({ id: 1 });
            mockRepos.productTag.replaceMany.mockResolvedValue([{ id: 1, product_id: 1, tag_id: 1 }]);

            const res = await svc.replaceTagsForProduct(1, [1, 2]);

            expect(res).toBeDefined();
        });
    });

    describe('Controller HTTP response codes', () => {
        it('returns 200 for successful delete', async () => {
            const { StoreController } = await import('../src/controllers/store.controller');
            const controller = new StoreController();

            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            mockRepos.store.softDelete.mockResolvedValue(true);
            mockReq.params = { id: '1' };

            await controller.deleteStore(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('returns 201 for POST (create)', async () => {
            const { TagController } = await import('../src/controllers/tag.controller');
            const controller = new TagController();

            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            mockRepos.tag.create.mockResolvedValue({ id: 1, name: 't' });
            mockReq.body = { store_id: 1, name: 't', color: 'blue', description: null, start_time: '09:00', end_time: '18:00', active: true };

            await controller.createTag(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it('returns 200 for PUT (update)', async () => {
            const { ProductController } = await import('../src/controllers/product.controller');
            const controller = new ProductController();

            mockRepos.product.findById.mockResolvedValue({ id: 1, store_id: 1 });
            mockRepos.product.update.mockResolvedValue({ id: 1, name: 'new' });
            mockReq.params = { id: '1' };
            mockReq.body = { name: 'new' };

            await controller.updateProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('Ownership checks', () => {
        it('inventory ownership validates product + store chain', async () => {
            const { ownsInventoryEntry } = await import('../src/middlewares/ownership.middleware');

            mockReq.params = { id: '1' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.inventory.findById.mockResolvedValue({ id: 1, product_id: 1 });
            mockRepos.product.findById.mockResolvedValue({ id: 1, store_id: 1 });
            mockRepos.store.findById.mockResolvedValue({ id: 1, admin_id: 1 });

            await ownsInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('inventory entry not found throws NotFoundError', async () => {
            const { ownsInventoryEntry } = await import('../src/middlewares/ownership.middleware');

            mockReq.params = { id: '999' };
            mockReq.user = { id: 1, role: 'admin', storeId: null };
            mockRepos.inventory.findById.mockResolvedValue(null);

            await ownsInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
        });
    });
});
