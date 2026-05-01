import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockInventoryService = {
    createInventoryEntry: vi.fn(),
    deleteInventoryEntry: vi.fn(),
    getInventoryEntriesByProductId: vi.fn(),
    getStockByProductId: vi.fn(),
};

vi.mock('../../src/services/inventory.service', () => ({
    InventoryService: class {
        createInventoryEntry = mockInventoryService.createInventoryEntry;
        deleteInventoryEntry = mockInventoryService.deleteInventoryEntry;
        getInventoryEntriesByProductId = mockInventoryService.getInventoryEntriesByProductId;
        getStockByProductId = mockInventoryService.getStockByProductId;
    },
}));

describe('InventoryController', () => {
    let controller: any;
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: NextFunction;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { InventoryController } = await import('../../src/controllers/inventory.controller');
        controller = new InventoryController();

        mockReq = {
            params: {},
            body: {},
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        mockNext = vi.fn();
    });

    describe('createInventoryEntry', () => {
        it('returns 201 with entry on success', async () => {
            const entryData = { product_id: 1, movement_type: 'in', quantity: 10 };
            const created = { id: 1, ...entryData };
            mockReq.body = entryData;
            mockInventoryService.createInventoryEntry.mockResolvedValue(created);

            await controller.createInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(created);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Create failed');
            mockReq.body = { product_id: 1 };
            mockInventoryService.createInventoryEntry.mockRejectedValue(err);

            await controller.createInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('deleteInventoryEntry', () => {
        it('returns 200 with success message on delete', async () => {
            mockReq.params = { id: '1' };
            mockInventoryService.deleteInventoryEntry.mockResolvedValue(true);

            await controller.deleteInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Entrada de inventario eliminada exitosamente.' });
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Delete failed');
            mockReq.params = { id: '1' };
            mockInventoryService.deleteInventoryEntry.mockRejectedValue(err);

            await controller.deleteInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getInventoryEntriesByProductId', () => {
        it('returns 200 with entries on success', async () => {
            const entries = [
                { id: 1, product_id: 1, movement_type: 'in', quantity: 10 },
                { id: 2, product_id: 1, movement_type: 'out', quantity: 3 },
            ];
            mockReq.params = { product_id: '1' };
            mockInventoryService.getInventoryEntriesByProductId.mockResolvedValue(entries);

            await controller.getInventoryEntriesByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(entries);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Product error');
            mockReq.params = { product_id: '1' };
            mockInventoryService.getInventoryEntriesByProductId.mockRejectedValue(err);

            await controller.getInventoryEntriesByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getStockByProductId', () => {
        it('returns 200 with stock on success', async () => {
            mockReq.params = { product_id: '1' };
            mockInventoryService.getStockByProductId.mockResolvedValue(42);

            await controller.getStockByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ product_id: 1, stock: 42 });
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Product error');
            mockReq.params = { product_id: '1' };
            mockInventoryService.getStockByProductId.mockRejectedValue(err);

            await controller.getStockByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
});
