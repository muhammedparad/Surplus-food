import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import 'multer';
import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadResponseDto } from './dto/upload-response.dto.js';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
] as const;

export const ALLOWED_DOCUMENT_MIMETYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
] as const;

const MIME_EXTENSIONS_MAP: Record<string, readonly string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

@Injectable()
export class UploadsService {
  private baseUploadDir: string;

  constructor(
    @Optional() private readonly configService?: ConfigService,
    customBaseDir?: string,
  ) {
    this.baseUploadDir =
      customBaseDir ??
      this.configService?.get<string>('app.uploadDir') ??
      process.env.UPLOAD_DIR ??
      path.resolve(process.cwd(), 'uploads');
  }

  getBaseUploadDir(): string {
    return this.baseUploadDir;
  }

  setBaseUploadDir(dir: string): void {
    this.baseUploadDir = dir;
  }

  async saveImage(file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.saveFile(
      file,
      'images',
      ALLOWED_IMAGE_MIMETYPES,
      ALLOWED_IMAGE_EXTENSIONS,
      MAX_IMAGE_SIZE_BYTES,
      '5MB',
    );
  }

  async saveDocument(file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.saveFile(
      file,
      'documents',
      ALLOWED_DOCUMENT_MIMETYPES,
      ALLOWED_DOCUMENT_EXTENSIONS,
      MAX_DOCUMENT_SIZE_BYTES,
      '10MB',
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.saveImage(file);
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadResponseDto> {
    return this.saveDocument(file);
  }

  private async saveFile(
    file: Express.Multer.File,
    subDirectory: 'images' | 'documents',
    allowedMimes: readonly string[],
    allowedExtensions: readonly string[],
    maxSizeBytes: number,
    limitLabel: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer is empty or missing');
    }

    const effectiveSize = Math.max(file.size ?? 0, file.buffer.length);
    if (effectiveSize === 0) {
      throw new BadRequestException('Uploaded file cannot be empty');
    }

    if (effectiveSize > maxSizeBytes) {
      throw new BadRequestException(
        `File size of ${effectiveSize} bytes exceeds the maximum limit of ${limitLabel}`,
      );
    }

    const cleanMime = (file.mimetype ?? '').split(';')[0].trim().toLowerCase();
    if (!allowedMimes.includes(cleanMime)) {
      throw new BadRequestException(
        `Invalid file MIME type "${file.mimetype}". Allowed types: ${allowedMimes.join(', ')}`,
      );
    }

    const rawOriginalName = file.originalname ?? '';
    const ext = path.extname(rawOriginalName).toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension "${ext}". Allowed extensions: ${allowedExtensions.join(', ')}`,
      );
    }

    const expectedExtensions = MIME_EXTENSIONS_MAP[cleanMime] ?? [];
    if (!expectedExtensions.includes(ext)) {
      throw new BadRequestException(
        `File extension "${ext}" does not match MIME type "${cleanMime}". Expected: ${expectedExtensions.join(', ')}`,
      );
    }

    const uniqueFilename = `${randomUUID()}${ext}`;
    const targetDir = path.resolve(this.baseUploadDir, subDirectory);
    await fs.mkdir(targetDir, { recursive: true });

    const targetPath = path.resolve(targetDir, uniqueFilename);
    await fs.writeFile(targetPath, file.buffer);

    const publicUrl = `/uploads/${subDirectory}/${uniqueFilename}`;

    return new UploadResponseDto({
      url: publicUrl,
      filename: uniqueFilename,
      size: effectiveSize,
      mimetype: cleanMime,
    });
  }
}
