import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Readable } from 'node:stream';
import 'multer';
import { BadRequestException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  UploadsService,
} from './uploads.service.js';

function createMockFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  const defaultBuffer = Buffer.from('test-file-content');
  return {
    fieldname: 'file',
    originalname: 'donation.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: defaultBuffer.length,
    buffer: defaultBuffer,
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as Readable,
    ...overrides,
  };
}

describe('UploadsService', () => {
  let service: UploadsService;
  let testUploadDir: string;

  beforeEach(async () => {
    testUploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nest-uploads-spec-'));
    service = new UploadsService(undefined, testUploadDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testUploadDir, { recursive: true, force: true });
    } catch {
      // Ignore directory cleanup failure
    }
  });

  describe('Image uploads', () => {
    it('successfully stores a JPEG image and creates images directory if missing', async () => {
      const mockFile = createMockFile({
        originalname: 'curry-plate.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-jpeg-image-bytes'),
      });

      const result = await service.saveImage(mockFile);

      expect(result.url).toMatch(/^\/uploads\/images\/[a-f0-9-]+\.jpg$/);
      expect(result.filename).toMatch(/^[a-f0-9-]+\.jpg$/);
      expect(result.mimetype).toBe('image/jpeg');
      expect(result.size).toBe(mockFile.buffer.length);

      const filePath = path.join(testUploadDir, 'images', result.filename);
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const savedContent = await fs.readFile(filePath);
      expect(savedContent).toEqual(mockFile.buffer);
    });

    it('successfully stores an image with .jpeg extension', async () => {
      const mockFile = createMockFile({
        originalname: 'sample.jpeg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('jpeg-bytes'),
      });

      const result = await service.saveImage(mockFile);
      expect(result.filename).toMatch(/^[a-f0-9-]+\.jpeg$/);
      expect(result.mimetype).toBe('image/jpeg');
    });

    it('successfully stores a PNG image', async () => {
      const mockFile = createMockFile({
        originalname: 'meal-box.png',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-png-bytes'),
      });

      const result = await service.saveImage(mockFile);
      expect(result.url).toMatch(/^\/uploads\/images\/[a-f0-9-]+\.png$/);
      expect(result.filename).toMatch(/^[a-f0-9-]+\.png$/);
      expect(result.mimetype).toBe('image/png');
    });

    it('successfully stores a WebP image', async () => {
      const mockFile = createMockFile({
        originalname: 'vegetables.webp',
        mimetype: 'image/webp',
        buffer: Buffer.from('fake-webp-bytes'),
      });

      const result = await service.saveImage(mockFile);
      expect(result.url).toMatch(/^\/uploads\/images\/[a-f0-9-]+\.webp$/);
      expect(result.filename).toMatch(/^[a-f0-9-]+\.webp$/);
      expect(result.mimetype).toBe('image/webp');
    });

    it('accepts an image at the exact 5MB limit', async () => {
      const mockFile = createMockFile({
        originalname: 'boundary.jpg',
        mimetype: 'image/jpeg',
        size: MAX_IMAGE_SIZE_BYTES,
        buffer: Buffer.alloc(10), // Small buffer with size metadata at limit
      });

      const result = await service.saveImage(mockFile);
      expect(result.size).toBe(MAX_IMAGE_SIZE_BYTES);
    });

    it('rejects an image exceeding the 5MB limit', async () => {
      const mockFile = createMockFile({
        originalname: 'large-photo.jpg',
        mimetype: 'image/jpeg',
        size: MAX_IMAGE_SIZE_BYTES + 1,
        buffer: Buffer.alloc(10),
      });

      await expect(service.saveImage(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveImage(mockFile)).rejects.toThrow(/exceeds the maximum limit/i);
    });

    it('rejects null or undefined file', async () => {
      await expect(
        service.saveImage(null as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects file with missing or empty buffer', async () => {
      const emptyBufferFile = createMockFile({
        buffer: Buffer.alloc(0),
        size: 0,
      });

      await expect(service.saveImage(emptyBufferFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects disallowed image MIME types (e.g. application/pdf, text/plain)', async () => {
      const pdfAsImage = createMockFile({
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
      });

      await expect(service.saveImage(pdfAsImage)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveImage(pdfAsImage)).rejects.toThrow(/Invalid file MIME type/i);
    });

    it('rejects disallowed file extensions (e.g. .exe, .sh, .php)', async () => {
      const dangerousFile = createMockFile({
        originalname: 'exploit.php',
        mimetype: 'image/jpeg',
      });

      await expect(service.saveImage(dangerousFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects file extension that does not match the image MIME type', async () => {
      const mismatched = createMockFile({
        originalname: 'photo.png',
        mimetype: 'image/jpeg',
      });

      await expect(service.saveImage(mismatched)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveImage(mismatched)).rejects.toThrow(/does not match MIME type/i);
    });

    it('provides uploadImage alias that behaves identically to saveImage', async () => {
      const mockFile = createMockFile({
        originalname: 'alias-test.png',
        mimetype: 'image/png',
      });

      const result = await service.uploadImage(mockFile);
      expect(result.url).toContain('/uploads/images/');
    });
  });

  describe('Document uploads', () => {
    it('successfully stores a PDF document and creates documents directory if missing', async () => {
      const mockFile = createMockFile({
        originalname: 'fssai-license.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 mock content'),
      });

      const result = await service.saveDocument(mockFile);

      expect(result.url).toMatch(/^\/uploads\/documents\/[a-f0-9-]+\.pdf$/);
      expect(result.filename).toMatch(/^[a-f0-9-]+\.pdf$/);
      expect(result.mimetype).toBe('application/pdf');

      const filePath = path.join(testUploadDir, 'documents', result.filename);
      const exists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(filePath);
      expect(content).toEqual(mockFile.buffer);
    });

    it('successfully stores a JPEG verification document', async () => {
      const mockFile = createMockFile({
        originalname: 'certificate-scan.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('scanned-doc-bytes'),
      });

      const result = await service.saveDocument(mockFile);
      expect(result.url).toMatch(/^\/uploads\/documents\/[a-f0-9-]+\.jpg$/);
      expect(result.mimetype).toBe('image/jpeg');
    });

    it('successfully stores a PNG verification document', async () => {
      const mockFile = createMockFile({
        originalname: 'govt-id-card.png',
        mimetype: 'image/png',
        buffer: Buffer.from('id-card-bytes'),
      });

      const result = await service.saveDocument(mockFile);
      expect(result.url).toMatch(/^\/uploads\/documents\/[a-f0-9-]+\.png$/);
      expect(result.mimetype).toBe('image/png');
    });

    it('accepts a document at the exact 10MB limit', async () => {
      const mockFile = createMockFile({
        originalname: 'large-charter.pdf',
        mimetype: 'application/pdf',
        size: MAX_DOCUMENT_SIZE_BYTES,
        buffer: Buffer.alloc(10),
      });

      const result = await service.saveDocument(mockFile);
      expect(result.size).toBe(MAX_DOCUMENT_SIZE_BYTES);
    });

    it('rejects a document exceeding the 10MB limit', async () => {
      const mockFile = createMockFile({
        originalname: 'oversized.pdf',
        mimetype: 'application/pdf',
        size: MAX_DOCUMENT_SIZE_BYTES + 1,
        buffer: Buffer.alloc(10),
      });

      await expect(service.saveDocument(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.saveDocument(mockFile)).rejects.toThrow(/exceeds the maximum limit/i);
    });

    it('rejects disallowed document MIME types (e.g. video, zip, webp)', async () => {
      const zipDoc = createMockFile({
        originalname: 'archive.zip',
        mimetype: 'application/zip',
      });

      await expect(service.saveDocument(zipDoc)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects document extension that does not match MIME type', async () => {
      const mismatchedDoc = createMockFile({
        originalname: 'document.pdf',
        mimetype: 'image/png',
      });

      await expect(service.saveDocument(mismatchedDoc)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('provides uploadDocument alias that behaves identically to saveDocument', async () => {
      const mockFile = createMockFile({
        originalname: 'cert.pdf',
        mimetype: 'application/pdf',
      });

      const result = await service.uploadDocument(mockFile);
      expect(result.url).toContain('/uploads/documents/');
    });
  });

  describe('Configuration & directory utilities', () => {
    it('allows changing base upload directory dynamically', () => {
      const customPath = path.join(testUploadDir, 'custom');
      service.setBaseUploadDir(customPath);
      expect(service.getBaseUploadDir()).toBe(customPath);
    });
  });
});
