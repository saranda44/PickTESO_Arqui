import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    store: { findById: vi.fn() },
    product: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findByStoreId: vi.fn(), getProductsWithTags: vi.fn() },
};

vi.mock('../../repositories', () => ({ default: mockRepos }));
vi.mock('../s3.service', () => ({ uploadImageToS3: vi.fn(), deleteImageFromS3: vi.fn() }));

describe('ProductService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createProduct throws when store does not exist', async () => {
        mockRepos.store.findById.mockResolvedValue(null);
        const { ProductService } = await import('../product.service');
        const svc = new ProductService();

        await expect(
            svc.createProduct({ store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true })
        ).rejects.toThrow('La tienda especificada no existe.');
    });

    it('createProduct uploads image and returns product', async () => {
        mockRepos.store.findById.mockResolvedValue({ id: 1 });
        const uploaded = 'https://bucket.s3.region.amazonaws.com/products/img.webp';
        const { uploadImageToS3 } = await import('../s3.service');
        (uploadImageToS3 as any).mockResolvedValue(uploaded);

        const createdProduct = { id: 1, store_id: 1, name: 'p', description: null, price: 1, product_image: uploaded, active: true, created_at: new Date(), updated_at: new Date() };
        mockRepos.product.create.mockResolvedValue(createdProduct);

        const { ProductService } = await import('../product.service');
        const svc = new ProductService();

        const res = await svc.createProduct({ store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true }, Buffer.from('img'));

        expect(uploadImageToS3).toHaveBeenCalled();
        expect(mockRepos.product.create).toHaveBeenCalledWith(expect.objectContaining({ product_image: uploaded }));
        expect(res).toEqual(createdProduct);
    });

    it('createProduct deletes uploaded image when DB create fails', async () => {
        mockRepos.store.findById.mockResolvedValue({ id: 1 });
        const { uploadImageToS3, deleteImageFromS3 } = await import('../s3.service');
        (uploadImageToS3 as any).mockResolvedValue('https://bucket/image.webp');
        (deleteImageFromS3 as any).mockResolvedValue(undefined);

        mockRepos.product.create.mockRejectedValue(new Error('DB error'));

        const { ProductService } = await import('../product.service');
        const svc = new ProductService();

        await expect(
            svc.createProduct({ store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true }, Buffer.from('img'))
        ).rejects.toThrow('DB error');

        expect(deleteImageFromS3).toHaveBeenCalled();
    });

    it('updateProduct rejects invalid fields', async () => {
        const { ProductService } = await import('../product.service');
        const svc = new ProductService();

        await expect(svc.updateProduct(1, { invalid: 'x' } as any)).rejects.toThrow('Se proporcionaron campos no válidos para actualizar.');
    });

    it('deleteProduct removes image and deletes product', async () => {
        const existing = { id: 1, product_image: 'https://bucket/old.webp' };
        mockRepos.product.findById.mockResolvedValue(existing);
        mockRepos.product.delete.mockResolvedValue(true);
        const { deleteImageFromS3 } = await import('../s3.service');
        (deleteImageFromS3 as any).mockResolvedValue(undefined);

        const { ProductService } = await import('../product.service');
        const svc = new ProductService();

        const res = await svc.deleteProduct(1);
        expect(deleteImageFromS3).toHaveBeenCalledWith(existing.product_image);
        expect(mockRepos.product.delete).toHaveBeenCalledWith(1);
        expect(res).toBe(true);
    });
});
