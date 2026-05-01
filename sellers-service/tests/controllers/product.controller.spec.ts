import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockProductService = {
    createProduct: vi.fn(),
    getProductById: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getProductsByStoreId: vi.fn(),
    getProductsWithTags: vi.fn(),
};

vi.mock('../../src/services/product.service', () => ({
    ProductService: class {
        createProduct = mockProductService.createProduct;
        getProductById = mockProductService.getProductById;
        updateProduct = mockProductService.updateProduct;
        deleteProduct = mockProductService.deleteProduct;
        getProductsByStoreId = mockProductService.getProductsByStoreId;
        getProductsWithTags = mockProductService.getProductsWithTags;
    },
}));

describe('ProductController', () => {
    let controller: any;
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: NextFunction;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { ProductController } = await import('../../src/controllers/product.controller');
        controller = new ProductController();

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

    describe('createProduct', () => {
        it('returns 201 with product on success', async () => {
            const productData = { store_id: 1, name: 'p', price: 10 };
            const created = { id: 1, ...productData };
            mockReq.body = productData;
            mockProductService.createProduct.mockResolvedValue(created);

            await controller.createProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(created);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Create failed');
            mockReq.body = { store_id: 1 };
            mockProductService.createProduct.mockRejectedValue(err);

            await controller.createProduct(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getProductById', () => {
        it('returns 200 with product on success', async () => {
            const product = { id: 1, name: 'p' };
            mockReq.params = { id: '1' };
            mockProductService.getProductById.mockResolvedValue(product);

            await controller.getProductById(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(product);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Not found');
            mockReq.params = { id: '1' };
            mockProductService.getProductById.mockRejectedValue(err);

            await controller.getProductById(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('updateProduct', () => {
        it('returns 200 with updated product on success', async () => {
            const updateData = { name: 'new' };
            const updated = { id: 1, name: 'new' };
            mockReq.params = { id: '1' };
            mockReq.body = updateData;
            mockReq.file = { buffer: Buffer.from('img') } as any;
            mockProductService.updateProduct.mockResolvedValue(updated);

            await controller.updateProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updated);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Update failed');
            mockReq.params = { id: '1' };
            mockReq.body = {};
            mockProductService.updateProduct.mockRejectedValue(err);

            await controller.updateProduct(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('deleteProduct', () => {
        it('returns 200 with success message on delete', async () => {
            mockReq.params = { id: '1' };
            mockProductService.deleteProduct.mockResolvedValue(true);

            await controller.deleteProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Producto eliminado exitosamente.' });
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Delete failed');
            mockReq.params = { id: '1' };
            mockProductService.deleteProduct.mockRejectedValue(err);

            await controller.deleteProduct(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getProductsByStoreId', () => {
        it('returns 200 with products on success', async () => {
            const products = [{ id: 1, name: 'p1' }];
            mockReq.params = { store_id: '1' };
            mockProductService.getProductsByStoreId.mockResolvedValue(products);

            await controller.getProductsByStoreId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(products);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Store error');
            mockReq.params = { store_id: '1' };
            mockProductService.getProductsByStoreId.mockRejectedValue(err);

            await controller.getProductsByStoreId(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getProductsWithTags', () => {
        it('returns 200 with products and tags on success', async () => {
            const products = [{ id: 1, name: 'p1', tags: [] }];
            mockReq.params = { store_id: '1' };
            mockProductService.getProductsWithTags.mockResolvedValue(products);

            await controller.getProductsWithTags(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(products);
        });

        it('returns 400 when store_id is invalid', async () => {
            mockReq.params = { store_id: 'invalid' };

            await controller.getProductsWithTags(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'store_id inválido' });
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Service error');
            mockReq.params = { store_id: '1' };
            mockProductService.getProductsWithTags.mockRejectedValue(err);

            await controller.getProductsWithTags(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
});
