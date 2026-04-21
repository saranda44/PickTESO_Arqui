import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    user: { exists: vi.fn() },
    store: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), softDelete: vi.fn(), findByAdminId: vi.fn() },
};

vi.mock('../../repositories', () => ({ default: mockRepos }));
vi.mock('../s3.service', () => ({ uploadImageToS3: vi.fn(), deleteImageFromS3: vi.fn() }));

describe('StoreService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createStore succeeds when admin exists', async () => {
        mockRepos.user.exists.mockResolvedValue(true);
        const created = { id: 1, name: 's', location: 'l', opening_time: '09:00', closing_time: '18:00', image: null, active: true, admin_id: 1, created_at: new Date(), updated_at: new Date() };
        mockRepos.store.create.mockResolvedValue(created);

        const { StoreService } = await import('../store.service');
        const svc = new StoreService();

        const res = await svc.createStore({ name: 's', location: 'l', opening_time: '09:00', closing_time: '18:00', image: null, active: true, admin_id: 1 });

        expect(mockRepos.user.exists).toHaveBeenCalledWith(1);
        expect(mockRepos.store.create).toHaveBeenCalled();
        expect(res).toEqual(created);
    });

    it('createStore throws when admin does not exist', async () => {
        mockRepos.user.exists.mockResolvedValue(false);
        const { StoreService } = await import('../store.service');
        const svc = new StoreService();

        await expect(
            svc.createStore({ name: 's', location: 'l', opening_time: '09:00', closing_time: '18:00', image: null, active: true, admin_id: 1 })
        ).rejects.toThrow('El administrador especificado no existe.');
    });

    it('updateStore rejects invalid fields', async () => {
        const { StoreService } = await import('../store.service');
        const svc = new StoreService();

        await expect(svc.updateStore(1, { invalid: 'x' } as any)).rejects.toThrow('Se proporcionaron campos no válidos para actualizar.');
    });

    it('updateStore uploads new image and deletes old one on success', async () => {
        const existing = { id: 1, image: 'https://bucket/old.webp' };
        mockRepos.store.findById.mockResolvedValue(existing);
        const { uploadImageToS3, deleteImageFromS3 } = await import('../s3.service');
        (uploadImageToS3 as any).mockResolvedValue('https://bucket/new.webp');
        (deleteImageFromS3 as any).mockResolvedValue(undefined);
        const updated = { id: 1, name: 's', location: 'l', opening_time: '09:00', closing_time: '18:00', image: 'https://bucket/new.webp', active: true, admin_id: 1, created_at: new Date(), updated_at: new Date() };
        mockRepos.store.update.mockResolvedValue(updated);

        const { StoreService } = await import('../store.service');
        const svc = new StoreService();

        const res = await svc.updateStore(1, { name: 's' }, Buffer.from('img'));

        expect(uploadImageToS3).toHaveBeenCalled();
        expect(deleteImageFromS3).toHaveBeenCalledWith(existing.image);
        expect(res).toEqual(updated);
    });
});
