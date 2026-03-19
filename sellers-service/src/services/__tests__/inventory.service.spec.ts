import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    product: { findById: vi.fn() },
    inventory: { findStockByProductId: vi.fn(), create: vi.fn(), findById: vi.fn(), delete: vi.fn(), findEntriesByProductId: vi.fn() },
};

vi.mock('../../repositories', () => ({ default: mockRepos }));

describe('InventoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createInventoryEntry throws when product missing', async () => {
        mockRepos.product.findById.mockResolvedValue(null);
        const { InventoryService } = await import('../inventory.service');
        const svc = new InventoryService();

        await expect(svc.createInventoryEntry({ product_id: 1, movement_type: 'in', quantity: 1 })).rejects.toThrow('El producto especificado no existe.');
    });

    it('createInventoryEntry throws when stock insufficient for out movement', async () => {
        mockRepos.product.findById.mockResolvedValue({ id: 1 });
        mockRepos.inventory.findStockByProductId.mockResolvedValue(0);
        const { InventoryService } = await import('../inventory.service');
        const svc = new InventoryService();

        await expect(svc.createInventoryEntry({ product_id: 1, movement_type: 'out', quantity: 5 })).rejects.toThrow('Stock insuficiente para realizar el movimiento de salida.');
    });

    it('createInventoryEntry succeeds when valid', async () => {
        mockRepos.product.findById.mockResolvedValue({ id: 1 });
        mockRepos.inventory.create.mockResolvedValue({ id: 1, product_id: 1, movement_type: 'in', quantity: 10, created_at: new Date(), updated_at: new Date() });
        const { InventoryService } = await import('../inventory.service');
        const svc = new InventoryService();

        const res = await svc.createInventoryEntry({ product_id: 1, movement_type: 'in', quantity: 10 });
        expect(res).toHaveProperty('id');
        expect(mockRepos.inventory.create).toHaveBeenCalled();
    });

    it('deleteInventoryEntry throws when entry missing', async () => {
        mockRepos.inventory.findById.mockResolvedValue(null);
        const { InventoryService } = await import('../inventory.service');
        const svc = new InventoryService();

        await expect(svc.deleteInventoryEntry(1)).rejects.toThrow('La entrada de inventario especificada no existe.');
    });

    it('getStockByProductId returns stock', async () => {
        mockRepos.product.findById.mockResolvedValue({ id: 1 });
        mockRepos.inventory.findStockByProductId.mockResolvedValue(42);
        const { InventoryService } = await import('../inventory.service');
        const svc = new InventoryService();

        const stock = await svc.getStockByProductId(1);
        expect(stock).toBe(42);
    });
});
