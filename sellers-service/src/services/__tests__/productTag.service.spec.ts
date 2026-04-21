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

vi.mock('../../repositories', () => ({ default: mockRepos }));

describe('ProductTagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaceTagsForProduct throws when tag_ids is empty', async () => {
    const { ProductTagService } = await import('../productTag.service');
    const svc = new ProductTagService();
    await expect(svc.replaceTagsForProduct(1, [])).rejects.toThrow('Debe proporcionar al menos un tag.');
  });

  it('getTagsByProductId returns tags', async () => {
    mockRepos.product.findById.mockResolvedValue({ id: 1 });
    const tags = [{ id: 1, name: 't', color: 'blue', store_id: 1 }];
    mockRepos.productTag.findTagsByProductId.mockResolvedValue(tags);

    const { ProductTagService } = await import('../productTag.service');
    const svc = new ProductTagService();
    const res = await svc.getTagsByProductId(1);

    expect(res).toEqual(tags);
    expect(mockRepos.product.findById).toHaveBeenCalledWith(1);
    expect(mockRepos.productTag.findTagsByProductId).toHaveBeenCalledWith(1);
  });
});
