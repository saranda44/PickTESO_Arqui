import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos: any = {
    store: { findById: vi.fn() },
    product: { findById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findByStoreId: vi.fn(), getProductsWithTags: vi.fn() },
};

vi.mock('../../src/repositories', () => ({ default: mockRepos }));
vi.mock('../../src/services/s3.service', () => ({ uploadImageToS3: vi.fn(), deleteImageFromS3: vi.fn() }));

describe('ProductService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createProduct', () => {
        it('throws when store does not exist', async () => {
            mockRepos.store.findById.mockResolvedValue(null);
            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(
                svc.createProduct({ store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true })
            ).rejects.toThrow('La tienda especificada no existe.');
        });

        it('uploads image and returns product', async () => {
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            const uploaded = 'https://bucket.s3.region.amazonaws.com/products/img.webp';
            const { uploadImageToS3 } = await import('../../src/services/s3.service');
            (uploadImageToS3 as any).mockResolvedValue(uploaded);

            const createdProduct = { id: 1, store_id: 1, name: 'p', description: null, price: 1, product_image: uploaded, active: true, created_at: new Date(), updated_at: new Date() };
            mockRepos.product.create.mockResolvedValue(createdProduct);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            const res = await svc.createProduct({ store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true }, Buffer.from('img'));

            expect(uploadImageToS3).toHaveBeenCalled();
            expect(mockRepos.product.create).toHaveBeenCalledWith(expect.objectContaining({ product_image: uploaded }));
            expect(res).toEqual(createdProduct);
        });

        it('deletes uploaded image when DB create fails', async () => {
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            const { uploadImageToS3, deleteImageFromS3 } = await import('../../src/services/s3.service');
            (uploadImageToS3 as any).mockResolvedValue('https://bucket/image.webp');
            (deleteImageFromS3 as any).mockResolvedValue(undefined);

            mockRepos.product.create.mockRejectedValue(new Error('DB error'));

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(
                svc.createProduct({ store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true }, Buffer.from('img'))
            ).rejects.toThrow('DB error');

            expect(deleteImageFromS3).toHaveBeenCalled();
        });
    });

    describe('getProductById', () => {
        it('returns product when found', async () => {
            const product = { id: 1, store_id: 1, name: 'p', description: null, price: 1, product_image: null, active: true, created_at: new Date(), updated_at: new Date() };
            mockRepos.product.findById.mockResolvedValue(product);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            const res = await svc.getProductById(1);
            expect(res).toEqual(product);
        });

        it('throws when product not found', async () => {
            mockRepos.product.findById.mockResolvedValue(null);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(svc.getProductById(1)).rejects.toThrow('El producto especificado no existe.');
        });
    });

    describe('updateProduct', () => {
        it('rejects invalid fields', async () => {
            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(svc.updateProduct(1, { invalid: 'x' } as any)).rejects.toThrow('Se proporcionaron campos no válidos para actualizar.');
        });

        it('successfully updates product', async () => {
            const existing = { id: 1, store_id: 1, name: 'old', price: 10, product_image: null };
            mockRepos.product.findById.mockResolvedValue(existing);
            const updated = { id: 1, store_id: 1, name: 'new', price: 20, product_image: null, created_at: new Date(), updated_at: new Date() };
            mockRepos.product.update.mockResolvedValue(updated);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            const res = await svc.updateProduct(1, { name: 'new', price: 20 });
            expect(res).toEqual(updated);
        });

        it('throws when product not found', async () => {
            mockRepos.product.findById.mockResolvedValue(null);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(svc.updateProduct(1, { name: 'new' })).rejects.toThrow('El producto especificado no existe.');
        });
    });

    describe('deleteProduct', () => {
        it('removes image and deletes product', async () => {
            const existing = { id: 1, product_image: 'https://bucket/old.webp' };
            mockRepos.product.findById.mockResolvedValue(existing);
            mockRepos.product.delete.mockResolvedValue(true);
            const { deleteImageFromS3 } = await import('../../src/services/s3.service');
            (deleteImageFromS3 as any).mockResolvedValue(undefined);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            const res = await svc.deleteProduct(1);
            expect(deleteImageFromS3).toHaveBeenCalledWith(existing.product_image);
            expect(mockRepos.product.delete).toHaveBeenCalledWith(1);
            expect(res).toBe(true);
        });

        it('throws when product not found', async () => {
            mockRepos.product.findById.mockResolvedValue(null);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(svc.deleteProduct(1)).rejects.toThrow('El producto especificado no existe.');
        });
    });

    describe('getProductsByStoreId', () => {
        it('returns products for valid store', async () => {
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            const products = [
                { id: 1, store_id: 1, name: 'p1', price: 10 },
                { id: 2, store_id: 1, name: 'p2', price: 20 },
            ];
            mockRepos.product.findByStoreId.mockResolvedValue(products);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            const res = await svc.getProductsByStoreId(1);
            expect(res).toEqual(products);
            expect(mockRepos.product.findByStoreId).toHaveBeenCalledWith(1);
        });

        it('throws when store does not exist', async () => {
            mockRepos.store.findById.mockResolvedValue(null);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(svc.getProductsByStoreId(1)).rejects.toThrow('La tienda especificada no existe.');
        });
    });

    describe('getProductsWithTags', () => {
        it('returns products with tags for valid store', async () => {
            mockRepos.store.findById.mockResolvedValue({ id: 1 });
            const productsWithTags = [
                { id: 1, store_id: 1, name: 'p1', tags: [{ id: 1, name: 't1' }] },
            ];
            mockRepos.product.getProductsWithTags.mockResolvedValue(productsWithTags);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            const res = await svc.getProductsWithTags(1);
            expect(res).toEqual(productsWithTags);
            expect(mockRepos.product.getProductsWithTags).toHaveBeenCalledWith(1);
        });

        it('throws when store does not exist', async () => {
            mockRepos.store.findById.mockResolvedValue(null);

            const { ProductService } = await import('../../src/services/product.service');
            const svc = new ProductService();

            await expect(svc.getProductsWithTags(1)).rejects.toThrow('La tienda especificada no existe.');
        });
    });
});
