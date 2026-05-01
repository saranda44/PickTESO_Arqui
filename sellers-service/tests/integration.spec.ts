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

const mockS3 = {
    uploadImageToS3: vi.fn(),
    deleteImageFromS3: vi.fn(),
};

vi.mock('../src/repositories', () => ({ default: mockRepos }));
vi.mock('../src/services/s3.service', () => mockS3);

describe('Integration Tests', () => {
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
            file: undefined,
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        mockNext = vi.fn();
    });

    describe('Store endpoints', () => {
        it('POST /stores creates store with valid admin', async () => {
            const { StoreController } = await import('../src/controllers/store.controller');
            const controller = new StoreController();
            const storeData = { name: 'Store A', location: 'Location', admin_id: 1, opening_time: '09:00', closing_time: '18:00', image: null, active: true };

            mockRepos.user.exists.mockResolvedValue(true);
            mockRepos.store.create.mockResolvedValue({ id: 1, ...storeData });
            mockReq.body = storeData;

            await controller.createStore(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockRepos.store.create).toHaveBeenCalled();
        });

        it('GET /:id returns store when authorized', async () => {
            const { StoreController } = await import('../src/controllers/store.controller');
            const controller = new StoreController();
            const store = { id: 1, name: 'Store A', admin_id: 1 };

            mockReq.params = { id: '1' };
            mockRepos.store.findById.mockResolvedValue(store);

            await controller.getStoreById(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(store);
        });
    });

    describe('Product endpoints', () => {
        it('POST /products creates product in valid store', async () => {
            const { ProductController } = await import('../src/controllers/product.controller');
            const controller = new ProductController();
            const productData = { store_id: 1, name: 'Product A', price: 100, description: null, product_image: null, active: true };

            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            mockRepos.product.create.mockResolvedValue({ id: 1, ...productData });
            mockReq.body = productData;
            mockReq.file = { buffer: Buffer.from('img') } as any;

            await controller.createProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
        });

        it('GET /store/:store_id returns products with tags', async () => {
            const { ProductController } = await import('../src/controllers/product.controller');
            const controller = new ProductController();
            const products = [
                { id: 1, name: 'P1', tags: [] },
                { id: 2, name: 'P2', tags: [] },
            ];

            mockReq.params = { store_id: '1' };
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            mockRepos.product.getProductsWithTags.mockResolvedValue(products);

            await controller.getProductsWithTags(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(products);
        });
    });

    describe('Tag endpoints', () => {
        it('POST /tags creates tag in valid store', async () => {
            const { TagController } = await import('../src/controllers/tag.controller');
            const controller = new TagController();
            const tagData = { store_id: 1, name: 'Tag A', color: 'blue', description: null, start_time: '09:00', end_time: '18:00', active: true };

            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            mockRepos.tag.create.mockResolvedValue({ id: 1, ...tagData });
            mockReq.body = tagData;

            await controller.createTag(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
        });

        it('GET /store/:store_id returns tags for store', async () => {
            const { TagController } = await import('../src/controllers/tag.controller');
            const controller = new TagController();
            const tags = [
                { id: 1, name: 'T1', color: 'blue' },
                { id: 2, name: 'T2', color: 'red' },
            ];

            mockReq.params = { store_id: '1' };
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            mockRepos.tag.findAllByStoreId.mockResolvedValue(tags);

            await controller.getTagsByStoreId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tags);
        });
    });

    describe('Inventory endpoints', () => {
        it('POST /inventory creates entry for valid product', async () => {
            const { InventoryController } = await import('../src/controllers/inventory.controller');
            const controller = new InventoryController();
            const entryData = { product_id: 1, movement_type: 'in', quantity: 10 };

            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.create.mockResolvedValue({ id: 1, ...entryData });
            mockReq.body = entryData;

            await controller.createInventoryEntry(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
        });

        it('GET /product/:product_id/stock returns stock', async () => {
            const { InventoryController } = await import('../src/controllers/inventory.controller');
            const controller = new InventoryController();

            mockReq.params = { product_id: '1' };
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.inventory.findStockByProductId.mockResolvedValue(42);

            await controller.getStockByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ product_id: 1, stock: 42 });
        });
    });

    describe('ProductTag endpoints', () => {
        it('PUT /:product_id/tags replaces tags', async () => {
            const { ProductTagController } = await import('../src/controllers/productTag.controller');
            const controller = new ProductTagController();
            const result = [
                { id: 1, product_id: 1, tag_id: 1 },
                { id: 2, product_id: 1, tag_id: 2 },
            ];

            mockReq.params = { product_id: '1' };
            mockReq.body = { tag_ids: [1, 2] };
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.tag.findById.mockResolvedValue({ id: 1, name: 't' });
            mockRepos.productTag.replaceMany.mockResolvedValue(result);

            await controller.replaceTagsForProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(result);
        });

        it('GET /:product_id/tags returns tags for product', async () => {
            const { ProductTagController } = await import('../src/controllers/productTag.controller');
            const controller = new ProductTagController();
            const tags = [{ id: 1, name: 'T1', color: 'blue' }];

            mockReq.params = { product_id: '1' };
            mockRepos.product.findById.mockResolvedValue({ id: 1 });
            mockRepos.productTag.findTagsByProductId.mockResolvedValue(tags);

            await controller.getTagsByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tags);
        });
    });

    describe('Error handling', () => {
        it('returns error when store not found', async () => {
            const { StoreController } = await import('../src/controllers/store.controller');
            const controller = new StoreController();

            mockReq.params = { id: '999' };
            mockRepos.store.findById.mockResolvedValue(null);

            await controller.getStoreById(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('returns error when product not found', async () => {
            const { ProductController } = await import('../src/controllers/product.controller');
            const controller = new ProductController();

            mockReq.params = { id: '999' };
            mockRepos.product.findById.mockResolvedValue(null);

            await controller.getProductById(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
