import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockProductTagService = {
    replaceTagsForProduct: vi.fn(),
    getTagsByProductId: vi.fn(),
};

vi.mock('../../src/services/productTag.service', () => ({
    ProductTagService: class {
        replaceTagsForProduct = mockProductTagService.replaceTagsForProduct;
        getTagsByProductId = mockProductTagService.getTagsByProductId;
    },
}));

describe('ProductTagController', () => {
    let controller: any;
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: NextFunction;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { ProductTagController } = await import('../../src/controllers/productTag.controller');
        controller = new ProductTagController();

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

    describe('replaceTagsForProduct', () => {
        it('returns 200 with result on success', async () => {
            const tagIds = [1, 2];
            const result = [
                { id: 1, product_id: 1, tag_id: 1 },
                { id: 2, product_id: 1, tag_id: 2 },
            ];
            mockReq.params = { product_id: '1' };
            mockReq.body = { tag_ids: tagIds };
            mockProductTagService.replaceTagsForProduct.mockResolvedValue(result);

            await controller.replaceTagsForProduct(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(result);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Replace failed');
            mockReq.params = { product_id: '1' };
            mockReq.body = { tag_ids: [1] };
            mockProductTagService.replaceTagsForProduct.mockRejectedValue(err);

            await controller.replaceTagsForProduct(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getTagsByProductId', () => {
        it('returns 200 with tags on success', async () => {
            const tags = [{ id: 1, name: 't1', color: 'blue' }];
            mockReq.params = { product_id: '1' };
            mockProductTagService.getTagsByProductId.mockResolvedValue(tags);

            await controller.getTagsByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tags);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Product error');
            mockReq.params = { product_id: '1' };
            mockProductTagService.getTagsByProductId.mockRejectedValue(err);

            await controller.getTagsByProductId(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
});
