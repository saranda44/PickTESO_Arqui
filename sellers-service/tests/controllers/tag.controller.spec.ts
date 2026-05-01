import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

const mockTagService = {
    createTag: vi.fn(),
    getTagById: vi.fn(),
    updateTag: vi.fn(),
    softDeleteTag: vi.fn(),
    getTagsByStoreId: vi.fn(),
};

vi.mock('../../src/services/tag.service', () => ({
    TagService: class {
        createTag = mockTagService.createTag;
        getTagById = mockTagService.getTagById;
        updateTag = mockTagService.updateTag;
        softDeleteTag = mockTagService.softDeleteTag;
        getTagsByStoreId = mockTagService.getTagsByStoreId;
    },
}));

describe('TagController', () => {
    let controller: any;
    let mockReq: Partial<Request>;
    let mockRes: any;
    let mockNext: NextFunction;

    beforeEach(async () => {
        vi.clearAllMocks();
        const { TagController } = await import('../../src/controllers/tag.controller');
        controller = new TagController();

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

    describe('createTag', () => {
        it('returns 201 with tag on success', async () => {
            const tagData = { store_id: 1, name: 't', color: 'blue' };
            const created = { id: 1, ...tagData };
            mockReq.body = tagData;
            mockTagService.createTag.mockResolvedValue(created);

            await controller.createTag(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(created);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Create failed');
            mockReq.body = { store_id: 1 };
            mockTagService.createTag.mockRejectedValue(err);

            await controller.createTag(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getTagById', () => {
        it('returns 200 with tag on success', async () => {
            const tag = { id: 1, name: 't' };
            mockReq.params = { id: '1' };
            mockTagService.getTagById.mockResolvedValue(tag);

            await controller.getTagById(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tag);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Not found');
            mockReq.params = { id: '1' };
            mockTagService.getTagById.mockRejectedValue(err);

            await controller.getTagById(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('updateTag', () => {
        it('returns 200 with updated tag on success', async () => {
            const updateData = { name: 'new' };
            const updated = { id: 1, name: 'new' };
            mockReq.params = { id: '1' };
            mockReq.body = updateData;
            mockTagService.updateTag.mockResolvedValue(updated);

            await controller.updateTag(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(updated);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Update failed');
            mockReq.params = { id: '1' };
            mockReq.body = {};
            mockTagService.updateTag.mockRejectedValue(err);

            await controller.updateTag(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('softDeleteTag', () => {
        it('returns 200 with success message on delete', async () => {
            mockReq.params = { id: '1' };
            mockTagService.softDeleteTag.mockResolvedValue(true);

            await controller.softDeleteTag(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Tag eliminado exitosamente.' });
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Delete failed');
            mockReq.params = { id: '1' };
            mockTagService.softDeleteTag.mockRejectedValue(err);

            await controller.softDeleteTag(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });

    describe('getTagsByStoreId', () => {
        it('returns 200 with tags on success', async () => {
            const tags = [{ id: 1, name: 't1' }];
            mockReq.params = { store_id: '1' };
            mockTagService.getTagsByStoreId.mockResolvedValue(tags);

            await controller.getTagsByStoreId(mockReq as Request, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(tags);
        });

        it('passes error to next on service error', async () => {
            const err = new Error('Store error');
            mockReq.params = { store_id: '1' };
            mockTagService.getTagsByStoreId.mockRejectedValue(err);

            await controller.getTagsByStoreId(mockReq as Request, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(err);
        });
    });
});
