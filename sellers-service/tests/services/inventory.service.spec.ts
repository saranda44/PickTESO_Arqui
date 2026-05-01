import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    product: { findById: vi.fn() },
    inventory: { findStockByProductId: vi.fn(), create: vi.fn(), findById: vi.fn(), delete: vi.fn(), findEntriesByProductId: vi.fn() },
};

vi.mock('../../src/repositories', () => ({ default: mockRepos }));

describe('InventoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createInventoryEntry', () => {
        it('throws when product missing', async () => {
            mockRepos.product.findById.mockResolvedValue(null);
            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            await expect(svc.createInventoryEntry({ product_id: 1, movement_type: 'in', quantity: 1 })).rejects.toThrow('El producto especificado no existe.');
        });

        it('throws when stock insufficient for out movement', async () => {
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.findStockByProductId.mockResolvedValue(0);
            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            await expect(svc.createInventoryEntry({ product_id: 1, movement_type: 'out', quantity: 5 })).rejects.toThrow('Stock insuficiente para realizar el movimiento de salida.');
        });

        it('succeeds when valid', async () => {
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.create.mockResolvedValue({ id: 1, product_id: 1, movement_type: 'in', quantity: 10, created_at: new Date(), updated_at: new Date() });
            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            const res = await svc.createInventoryEntry({ product_id: 1, movement_type: 'in', quantity: 10 });
            expect(res).toHaveProperty('id');
            expect(mockRepos.inventory.create).toHaveBeenCalled();
        });

        it('allows out movement when stock sufficient', async () => {
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.findStockByProductId.mockResolvedValue(10);
            mockRepos.inventory.create.mockResolvedValue({ id: 1, product_id: 1, movement_type: 'out', quantity: 5, created_at: new Date(), updated_at: new Date() });

            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            const res = await svc.createInventoryEntry({ product_id: 1, movement_type: 'out', quantity: 5 });
            expect(res.movement_type).toBe('out');
        });
    });

    describe('deleteInventoryEntry', () => {
        it('throws when entry missing', async () => {
            mockRepos.inventory.findById.mockResolvedValue(null);
            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            await expect(svc.deleteInventoryEntry(1)).rejects.toThrow('La entrada de inventario especificada no existe.');
        });

        it('successfully deletes entry', async () => {
            const entry = { id: 1, product_id: 1, movement_type: 'in', quantity: 5 };
            mockRepos.inventory.findById.mockResolvedValue(entry);
            mockRepos.inventory.delete.mockResolvedValue(true);

            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            const res = await svc.deleteInventoryEntry(1);
            expect(res).toBe(true);
            expect(mockRepos.inventory.delete).toHaveBeenCalledWith(1);
        });
    });

    describe('getInventoryEntriesByProductId', () => {
        it('returns entries for valid product', async () => {
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            const entries = [
                { id: 1, product_id: 1, movement_type: 'in', quantity: 10 },
                { id: 2, product_id: 1, movement_type: 'out', quantity: 3 },
            ];
            mockRepos.inventory.findEntriesByProductId.mockResolvedValue(entries);

            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            const res = await svc.getInventoryEntriesByProductId(1);
            expect(res).toEqual(entries);
            expect(mockRepos.inventory.findEntriesByProductId).toHaveBeenCalledWith(1);
        });

        it('throws when product not found', async () => {
            mockRepos.product.findById.mockResolvedValue(null);

            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            await expect(svc.getInventoryEntriesByProductId(1)).rejects.toThrow('El producto especificado no existe.');
        });
    });

    describe('getStockByProductId', () => {
        it('returns stock for valid product', async () => {
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.findStockByProductId.mockResolvedValue(42);
            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            const stock = await svc.getStockByProductId(1);
            expect(stock).toBe(42);
        });

        it('throws when product not found', async () => {
            mockRepos.product.findById.mockResolvedValue(null);

            const { InventoryService } = await import('../../src/services/inventory.service');
            const svc = new InventoryService();

            await expect(svc.getStockByProductId(1)).rejects.toThrow('El producto especificado no existe.');
        });
    });
});
