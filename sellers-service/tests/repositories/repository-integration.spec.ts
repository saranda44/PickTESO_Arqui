import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
};

const mockPool = {
    query: vi.fn(),
    connect: vi.fn().mockResolvedValue(mockClient),
};

vi.mock('../../src/config/db.config', () => ({
    default: mockPool,
}));

describe('Repository Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('StoreRepository', () => {
        it('create inserts store and returns result', async () => {
            const { default: repos } = await import('../../src/repositories');
            const storeData = { name: 'Store', location: 'Loc', admin_id: 1, opening_time: '09:00', closing_time: '18:00', image: null, active: true };
            const result = { rows: [{ id: 1, ...storeData }], rowCount: 1 };
            mockPool.query.mockResolvedValue(result);

            const created = await repos.store.create(storeData);

            expect(created.id).toBe(1);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('findById queries by id', async () => {
            const { default: repos } = await import('../../src/repositories');
            const store = { id: 1, name: 'Store', admin_id: 1 };
            mockPool.query.mockResolvedValue({ rows: [store], rowCount: 1 });

            const found = await repos.store.findById(1);

            expect(found.id).toBe(1);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE'), [1]);
        });

        it('softDelete updates active to false', async () => {
            const { default: repos } = await import('../../src/repositories');
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            await repos.store.softDelete(1);

            const call = mockPool.query.mock.calls[0];
            expect(call[0]).toContain('active = false');
            expect(call[1]).toEqual([1]);
        });
    });

    describe('ProductRepository', () => {
        it('create inserts product', async () => {
            const { default: repos } = await import('../../src/repositories');
            const productData = { store_id: 1, name: 'P', description: null, price: 100, product_image: null, active: true };
            const result = { rows: [{ id: 1, ...productData }], rowCount: 1 };
            mockPool.query.mockResolvedValue(result);

            const created = await repos.product.create(productData);

            expect(created.id).toBe(1);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('findById queries product by id', async () => {
            const { default: repos } = await import('../../src/repositories');
            const product = { id: 1, name: 'P', store_id: 1, price: 100 };
            mockPool.query.mockResolvedValue({ rows: [product], rowCount: 1 });

            const found = await repos.product.findById(1);

            expect(found.id).toBe(1);
        });

        it('getProductsWithTags joins with tags', async () => {
            const { default: repos } = await import('../../src/repositories');
            const products = [
                { id: 1, name: 'P1', tags: [] },
                { id: 2, name: 'P2', tags: [{ id: 1, name: 't1' }] },
            ];
            mockPool.query.mockResolvedValue({ rows: products, rowCount: 2 });

            const found = await repos.product.getProductsWithTags(1);

            expect(found.length).toBe(2);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('LEFT JOIN'), [1]);
        });
    });

    describe('TagRepository', () => {
        it('create inserts tag', async () => {
            const { default: repos } = await import('../../src/repositories');
            const tagData = { store_id: 1, name: 'T', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true };
            const result = { rows: [{ id: 1, ...tagData }], rowCount: 1 };
            mockPool.query.mockResolvedValue(result);

            const created = await repos.tag.create(tagData);

            expect(created.id).toBe(1);
        });

        it('findAllByStoreId filters by store', async () => {
            const { default: repos } = await import('../../src/repositories');
            const tags = [{ id: 1, name: 'T1' }, { id: 2, name: 'T2' }];
            mockPool.query.mockResolvedValue({ rows: tags, rowCount: 2 });

            const found = await repos.tag.findAllByStoreId(1);

            expect(found.length).toBe(2);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('store_id'), [1]);
        });

        it('softDelete marks tag inactive', async () => {
            const { default: repos } = await import('../../src/repositories');
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            await repos.tag.softDelete(1);

            const call = mockPool.query.mock.calls[0];
            expect(call[0]).toContain('active = false');
        });
    });

    describe('InventoryRepository', () => {
        it('create inserts inventory entry', async () => {
            const { default: repos } = await import('../../src/repositories');
            const entryData = { product_id: 1, movement_type: 'in', quantity: 10 };
            const result = { rows: [{ id: 1, ...entryData }], rowCount: 1 };
            mockPool.query.mockResolvedValue(result);

            const created = await repos.inventory.create(entryData);

            expect(created.id).toBe(1);
        });

        it('findStockByProductId sums movements', async () => {
            const { default: repos } = await import('../../src/repositories');
            mockPool.query.mockResolvedValue({ rows: [{ stock: 42 }], rowCount: 1 });

            const stock = await repos.inventory.findStockByProductId(1);

            expect(stock).toBe(42);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SUM'), [1]);
        });

        it('delete removes entry', async () => {
            const { default: repos } = await import('../../src/repositories');
            mockPool.query.mockResolvedValue({ rowCount: 1 });

            await repos.inventory.delete(1);

            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1]);
        });
    });

    describe('ProductTagRepository', () => {
        it('replaceMany deletes old and inserts new tags', async () => {
            const { default: repos } = await import('../../src/repositories');
            mockClient.query.mockResolvedValue({ rows: [{ id: 1, product_id: 1, tag_id: 1 }], rowCount: 1 });

            const result = await repos.productTag.replaceMany(1, [1, 2]);

            expect(result).toBeDefined();
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1]);
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT'), expect.any(Array));
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('findTagsByProductId joins tags', async () => {
            const { default: repos } = await import('../../src/repositories');
            const tags = [{ id: 1, name: 'T1' }];
            mockPool.query.mockResolvedValue({ rows: tags, rowCount: 1 });

            const found = await repos.productTag.findTagsByProductId(1);

            expect(found.length).toBe(1);
            expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('JOIN'), [1]);
        });
    });

    describe('UserRepository', () => {
        it('exists queries user by id', async () => {
            const { default: repos } = await import('../../src/repositories');
            mockPool.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

            const exists = await repos.user.exists(1);

            expect(exists).toBe(true);
        });
    });
});
