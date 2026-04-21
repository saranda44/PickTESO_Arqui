import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    store: { findById: vi.fn() },
    tag: { create: vi.fn(), findById: vi.fn(), findAllByStoreId: vi.fn(), update: vi.fn(), softDelete: vi.fn() },
};

vi.mock('../../repositories', () => ({ default: mockRepos }));

describe('TagService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createTag throws when store missing', async () => {
        mockRepos.store.findById.mockResolvedValue(null);
        const { TagService } = await import('../tag.service');
        const svc = new TagService();

        await expect(svc.createTag({ store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true })).rejects.toThrow('La tienda especificada no existe.');
    });

    it('createTag succeeds when store exists', async () => {
        mockRepos.store.findById.mockResolvedValue({ id: 1 });
        const created = { id: 1, store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true, created_at: new Date(), updated_at: new Date() };
        mockRepos.tag.create.mockResolvedValue(created);

        const { TagService } = await import('../tag.service');
        const svc = new TagService();

        const res = await svc.createTag({ store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true });
        expect(res).toEqual(created);
    });

    it('updateTag rejects invalid fields', async () => {
        mockRepos.tag.findById.mockResolvedValue({ id: 1 });
        const { TagService } = await import('../tag.service');
        const svc = new TagService();

        await expect(svc.updateTag(1, { invalid: 'x' } as any)).rejects.toThrow('Se proporcionaron campos no válidos para actualizar.');
    });

    it('getTagById returns tag', async () => {
        const tag = { id: 1, store_id: 1, name: 't', description: null, start_time: '09:00', end_time: '18:00', color: null, active: true, created_at: new Date(), updated_at: new Date() };
        mockRepos.tag.findById.mockResolvedValue(tag);
        const { TagService } = await import('../tag.service');
        const svc = new TagService();

        const res = await svc.getTagById(1);
        expect(res).toEqual(tag);
    });
});
