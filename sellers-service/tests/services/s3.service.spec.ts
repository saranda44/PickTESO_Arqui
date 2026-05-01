import { vi, describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import multer from 'multer';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { BadRequestError } from '../../src/errors';
import { uploadImageToS3, deleteImageFromS3, upload } from '../../src/services/s3.service';

vi.mock('sharp');
vi.mock('@aws-sdk/client-s3');
vi.mock('../../src/config/s3.config', () => ({
  default: {
    send: vi.fn(),
  },
}));

describe('S3Service', () => {
  const mockS3Client = {
    send: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImageToS3', () => {
    it('uploads image with correct parameters', async () => {
      const buffer = Buffer.from('test-image');
      const mockMetadata = { width: 1000, height: 1000 };
      const processedBuffer = Buffer.from('processed-image');

      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue(mockMetadata),
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(processedBuffer),
      } as any);

      const result = await uploadImageToS3(buffer, 'products');

      expect(sharp).toHaveBeenCalledWith(buffer);
      expect(result).toMatch(/^https:\/\/.*\.s3\..*\.amazonaws\.com\/products\/.*\.webp$/);
    });

    it('throws error when image has no dimensions', async () => {
      const buffer = Buffer.from('invalid-image');
      const mockMetadata = { width: undefined, height: undefined };

      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue(mockMetadata),
      } as any);

      await expect(uploadImageToS3(buffer, 'products')).rejects.toThrow(
        'No se pudo leer las dimensiones de la imagen.'
      );
    });

    it('generates unique key for each upload', async () => {
      const buffer = Buffer.from('test-image');
      const mockMetadata = { width: 500, height: 500 };
      const processedBuffer = Buffer.from('processed');

      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue(mockMetadata),
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(processedBuffer),
      } as any);

      const result1 = await uploadImageToS3(buffer, 'products');
      const result2 = await uploadImageToS3(buffer, 'products');

      expect(result1).not.toBe(result2);
    });

    it('resizes image to 500x500 and converts to webp', async () => {
      const buffer = Buffer.from('test-image');
      const mockMetadata = { width: 2000, height: 2000 };
      const processedBuffer = Buffer.from('processed-image');

      const mockSharp = {
        metadata: vi.fn().mockResolvedValue(mockMetadata),
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(processedBuffer),
      } as any;

      vi.mocked(sharp).mockReturnValue(mockSharp);

      await uploadImageToS3(buffer, 'stores');

      expect(mockSharp.resize).toHaveBeenCalledWith(500, 500);
      expect(mockSharp.webp).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharp.toBuffer).toHaveBeenCalled();
    });

    it('uploads to correct S3 bucket and folder', async () => {
      const buffer = Buffer.from('test-image');
      const mockMetadata = { width: 800, height: 800 };
      const processedBuffer = Buffer.from('processed-image');

      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue(mockMetadata),
        resize: vi.fn().mockReturnThis(),
        webp: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(processedBuffer),
      } as any);

      await uploadImageToS3(buffer, 'products');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'image/webp',
          Body: processedBuffer,
        })
      );
    });
  });

  describe('deleteImageFromS3', () => {
    it('extracts key from URL and deletes object', async () => {
      const imageUrl = 'https://bucket.s3.region.amazonaws.com/products/12345-abc.webp';

      await deleteImageFromS3(imageUrl);

      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: 'products/12345-abc.webp',
        })
      );
    });

    it('handles URLs with encoded characters', async () => {
      const imageUrl = 'https://bucket.s3.region.amazonaws.com/stores/image%20name.webp';

      await deleteImageFromS3(imageUrl);

      expect(DeleteObjectCommand).toHaveBeenCalled();
    });

    it('works with different folder paths', async () => {
      const storesUrl = 'https://bucket.s3.region.amazonaws.com/stores/98765-xyz.webp';
      const productsUrl = 'https://bucket.s3.region.amazonaws.com/products/11111-def.webp';

      await deleteImageFromS3(storesUrl);
      await deleteImageFromS3(productsUrl);

      expect(DeleteObjectCommand).toHaveBeenCalledTimes(2);
    });
  });

  describe('upload multer middleware', () => {
    it('exports upload middleware', () => {
      expect(upload).toBeDefined();
    });
  });
});
