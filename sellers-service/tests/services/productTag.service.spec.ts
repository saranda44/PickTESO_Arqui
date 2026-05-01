import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockRepos = {
  product: {
    findById: vi.fn(),
  },
  tag: {
    findById: vi.fn(),
  },
  productTag: {
    replaceMany: vi.fn(),
    findTagsByProductId: vi.fn(),
  },
};

vi.mock('../../src/repositories', () => ({ default: mockRepos }));

describe('ProductTagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('replaceTagsForProduct', () => {
    it('throws when tag_ids is empty', async () => {
      const { ProductTagService } = await import('../../src/services/productTag.service');
      const svc = new ProductTagService();
      await expect(svc.replaceTagsForProduct(1, [])).rejects.toThrow('Debe proporcionar al menos un tag.');
    });

    it('throws when product does not exist', async () => {
      mockRepos.product.findById.mockResolvedValue(null);
      const { ProductTagService } = await import('../../src/services/productTag.service');
      const svc = new ProductTagService();
      await expect(svc.replaceTagsForProduct(1, [1, 2])).rejects.toThrow('El producto especificado no existe.');
    });

    it('throws when any tag does not exist', async () => {
      mockRepos.product.findById.mockResolvedValue({ id: 1 });
      mockRepos.tag.findById.mockImplementation(async (id) => {
        if (id === 1) return { id: 1, name: 't1' };
        return null;
      });

      const { ProductTagService } = await import('../../src/services/productTag.service');
      const svc = new ProductTagService();
      await expect(svc.replaceTagsForProduct(1, [1, 2])).rejects.toThrow('El tag 2 no existe.');
    });

    it('successfully replaces tags when all exist', async () => {
      mockRepos.product.findById.mockResolvedValue({ id: 1 });
      mockRepos.tag.findById.mockResolvedValue({ id: 1, name: 't' });
      const productTags = [
        { id: 1, product_id: 1, tag_id: 1 },
        { id: 2, product_id: 1, tag_id: 2 },
      ];
      mockRepos.productTag.replaceMany.mockResolvedValue(productTags);

      const { ProductTagService } = await import('../../src/services/productTag.service');
      const svc = new ProductTagService();
      const res = await svc.replaceTagsForProduct(1, [1, 2]);

      expect(res).toEqual(productTags);
      expect(mockRepos.productTag.replaceMany).toHaveBeenCalledWith(1, [1, 2]);
    });
  });

  describe('getTagsByProductId', () => {
    it('returns tags for valid product', async () => {
      mockRepos.product.findById.mockResolvedValue({ id: 1 });
      const tags = [{ id: 1, name: 't', color: 'blue', store_id: 1 }];
      mockRepos.productTag.findTagsByProductId.mockResolvedValue(tags);

      const { ProductTagService } = await import('../../src/services/productTag.service');
      const svc = new ProductTagService();
      const res = await svc.getTagsByProductId(1);

      expect(res).toEqual(tags);
      expect(mockRepos.product.findById).toHaveBeenCalledWith(1);
      expect(mockRepos.productTag.findTagsByProductId).toHaveBeenCalledWith(1);
    });

    it('throws when product does not exist', async () => {
      mockRepos.product.findById.mockResolvedValue(null);

      const { ProductTagService } = await import('../../src/services/productTag.service');
      const svc = new ProductTagService();

      await expect(svc.getTagsByProductId(1)).rejects.toThrow('El producto especificado no existe.');
    });
  });
});
