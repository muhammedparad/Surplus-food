import 'multer';
import type { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { UploadsController } from './uploads.controller.js';
import type { UploadsService } from './uploads.service.js';

describe('UploadsController', () => {
  let controller: UploadsController;
  let saveImageSpy: ReturnType<typeof vi.fn>;
  let saveDocumentSpy: ReturnType<typeof vi.fn>;
  let mockService: UploadsService;

  beforeEach(() => {
    saveImageSpy = vi.fn();
    saveDocumentSpy = vi.fn();

    mockService = {
      saveImage: saveImageSpy,
      saveDocument: saveDocumentSpy,
      uploadImage: vi.fn(),
      uploadDocument: vi.fn(),
      getBaseUploadDir: vi.fn(),
      setBaseUploadDir: vi.fn(),
    } as unknown as UploadsService;

    controller = new UploadsController(mockService);
  });

  it('delegates uploadImage to uploadsService.saveImage', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'meal.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 2048,
      buffer: Buffer.from('mock-meal'),
      destination: '',
      filename: '',
      path: '',
      stream: null as unknown as Readable,
    };

    const expectedResponse = new UploadResponseDto({
      url: '/uploads/images/abc-123.jpg',
      filename: 'abc-123.jpg',
      size: 2048,
      mimetype: 'image/jpeg',
    });

    saveImageSpy.mockResolvedValue(expectedResponse);

    const result = await controller.uploadImage(mockFile);

    expect(saveImageSpy).toHaveBeenCalledWith(mockFile);
    expect(result).toBe(expectedResponse);
  });

  it('delegates uploadDocument to uploadsService.saveDocument', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'license.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 4096,
      buffer: Buffer.from('mock-pdf'),
      destination: '',
      filename: '',
      path: '',
      stream: null as unknown as Readable,
    };

    const expectedResponse = new UploadResponseDto({
      url: '/uploads/documents/doc-456.pdf',
      filename: 'doc-456.pdf',
      size: 4096,
      mimetype: 'application/pdf',
    });

    saveDocumentSpy.mockResolvedValue(expectedResponse);

    const result = await controller.uploadDocument(mockFile);

    expect(saveDocumentSpy).toHaveBeenCalledWith(mockFile);
    expect(result).toBe(expectedResponse);
  });
});
