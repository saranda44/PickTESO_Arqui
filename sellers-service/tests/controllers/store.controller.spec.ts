import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockStoreService = {
    createStore: vi.fn(),
    getStoreById: vi.fn(),
    getStoresByAdminId: vi.fn(),
    updateStore: vi.fn(),
    softDeleteStore: vi.fn(),
};

vi.mock('../../src/services/store.service', () => ({
    StoreService: class {
        createStore = mockStoreService.createStore;
        getStoreById = mockStoreService.getStoreById;
        getStoresByAdminId = mockStoreService.getStoresByAdminId;
        updateStore = mockStoreService.updateStore;
        softDeleteStore = mockStoreService.softDeleteStore;
    },
}));

describe('StoreController', () => {
    let controller: any;
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: NextFunction;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { StoreController } = await import('../../src/controllers/store.controller');
        controller = new StoreController();

        mockReq = {
            params: {},
            body: {},
            file: undefined,
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        mockNext = vi.fn();
    });

    describe('createStore', () => {
        it('returns 201 with store on success', async () => {
            const storeData = { name: 's', location: 'l', admin_id: 1 };
            const created = { id: 1, ...storeData };
            mockReq.body = storeData;
            mockStoreService.createStore.mockResolvedValue(created);

            await controller.createStore(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(created);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Store error');
            mockReq.body = { admin_id: 1 };
            mockStoreService.createStore.mockRejectedValue(err);

            await controller.createStore(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getStoreById', () => {
        it('returns 200 with store on success', async () => {
            const store = { id: 1, name: 's' };
            mockReq.params = { id: '1' };
            mockStoreService.getStoreById.mockResolvedValue(store);

            await controller.getStoreById(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(store);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Not found');
            mockReq.params = { id: '1' };
            mockStoreService.getStoreById.mockRejectedValue(err);

            await controller.getStoreById(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getStoresByAdminId', () => {
        it('returns 200 with stores on success', async () => {
            const stores = [{ id: 1, name: 's1' }, { id: 2, name: 's2' }];
            mockReq.params = { admin_id: '1' };
            mockStoreService.getStoresByAdminId.mockResolvedValue(stores);

            await controller.getStoresByAdminId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(stores);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Admin not found');
            mockReq.params = { admin_id: '1' };
            mockStoreService.getStoresByAdminId.mockRejectedValue(err);

            await controller.getStoresByAdminId(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('updateStore', () => {
        it('returns 200 with updated store on success', async () => {
            const updateData = { name: 'new' };
            const updated = { id: 1, name: 'new' };
            mockReq.params = { id: '1' };
            mockReq.body = updateData;
            mockReq.file = { buffer: Buffer.from('img') } as any;
            mockStoreService.updateStore.mockResolvedValue(updated);

            await controller.updateStore(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updated);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Update failed');
            mockReq.params = { id: '1' };
            mockReq.body = {};
            mockStoreService.updateStore.mockRejectedValue(err);

            await controller.updateStore(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('deleteStore', () => {
        it('returns 200 with success message on delete', async () => {
            mockReq.params = { id: '1' };
            mockStoreService.softDeleteStore.mockResolvedValue(true);

            await controller.deleteStore(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Tienda eliminada exitosamente.' });
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Delete failed');
            mockReq.params = { id: '1' };
            mockStoreService.softDeleteStore.mockRejectedValue(err);

            await controller.deleteStore(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
});
