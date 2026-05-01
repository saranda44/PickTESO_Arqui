import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    store: { findById: vi.fn() },
    tag: { create: vi.fn(), findById: vi.fn(), findAllByStoreId: vi.fn(), update: vi.fn(), softDelete: vi.fn() },
};

vi.mock('../../src/repositories', () => ({ default: mockRepos }));

describe('TagService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTag', () => {
        it('throws when store missing', async () => {
            mockRepos.store.findById.mockResolvedValue(null);
            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            await expect(svc.createTag({ store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true })).rejects.toThrow('La tienda especificada no existe.');
        });

        it('succeeds when store exists', async () => {
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            const created = { id: 1, store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true, created_at: new Date(), updated_at: new Date() };
            mockRepos.tag.create.mockResolvedValue(created);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            const res = await svc.createTag({ store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true });
            expect(res).toEqual(created);
        });
    });

    describe('getTagById', () => {
        it('returns tag when found', async () => {
            const tag = { id: 1, store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true, created_at: new Date(), updated_at: new Date() };
            mockRepos.tag.findById.mockResolvedValue(tag);
            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            const res = await svc.getTagById(1);
            expect(res).toEqual(tag);
        });

        it('throws when tag not found', async () => {
            mockRepos.tag.findById.mockResolvedValue(null);
            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            await expect(svc.getTagById(1)).rejects.toThrow('El tag especificado no existe.');
        });
    });

    describe('getTagsByStoreId', () => {
        it('returns tags for valid store', async () => {
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            const tags = [
                { id: 1, store_id: 1, name: 't1', color: 'blue' },
                { id: 2, store_id: 1, name: 't2', color: 'red' },
            ];
            mockRepos.tag.findAllByStoreId.mockResolvedValue(tags);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            const res = await svc.getTagsByStoreId(1);
            expect(res).toEqual(tags);
            expect(mockRepos.tag.findAllByStoreId).toHaveBeenCalledWith(1);
        });

        it('throws when store does not exist', async () => {
            mockRepos.store.findById.mockResolvedValue(null);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            await expect(svc.getTagsByStoreId(1)).rejects.toThrow('La tienda especificada no existe.');
        });
    });

    describe('updateTag', () => {
        it('rejects invalid fields', async () => {
            mockRepos.tag.findById.mockResolvedValue({ id: 1 });
            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            await expect(svc.updateTag(1, { invalid: 'x' } as any)).rejects.toThrow('Se proporcionaron campos no válidos para actualizar.');
        });

        it('updates tag successfully', async () => {
            const existing = { id: 1, store_id: 1, name: 't', color: 'blue' };
            mockRepos.tag.findById.mockResolvedValue(existing);
            const updated = { id: 1, store_id: 1, name: 't-updated', color: 'red', created_at: new Date(), updated_at: new Date() };
            mockRepos.tag.update.mockResolvedValue(updated);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            const res = await svc.updateTag(1, { name: 't-updated', color: 'red' });
            expect(res).toEqual(updated);
            expect(mockRepos.tag.update).toHaveBeenCalledWith(1, expect.any(Object));
        });

        it('throws when tag not found', async () => {
            mockRepos.tag.findById.mockResolvedValue(null);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            await expect(svc.updateTag(1, { name: 'new' })).rejects.toThrow('El tag especificado no existe.');
        });
    });

    describe('softDeleteTag', () => {
        it('deletes tag successfully', async () => {
            const tag = { id: 1, store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true, created_at: new Date(), updated_at: new Date() };
            mockRepos.tag.findById.mockResolvedValue(tag);
            mockRepos.tag.softDelete.mockResolvedValue(true);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            const res = await svc.softDeleteTag(1);
            expect(res).toBe(true);
            expect(mockRepos.tag.softDelete).toHaveBeenCalledWith(1);
        });

        it('throws when tag not found', async () => {
            mockRepos.tag.findById.mockResolvedValue(null);

            const { TagService } = await import('../../src/services/tag.service');
            const svc = new TagService();

            await expect(svc.softDeleteTag(1)).rejects.toThrow('El tag especificado no existe.');
        });
    });
});
