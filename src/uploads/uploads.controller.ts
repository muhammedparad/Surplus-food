import 'multer';
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadResponseDto } from './dto/upload-response.dto.js';
import { UploadsService } from './uploads.service.js';

@ApiTags('Media & Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a food donation photo or meal image (JPEG, PNG, WebP up to 5MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Food photo file to upload (JPEG, PNG, WebP, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image file uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid MIME type, mismatched extension, or size limit exceeded (max 5MB)',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    return this.uploadsService.saveImage(file);
  }

  @Post('document')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a verification license or certificate document (PDF, JPEG, PNG up to 10MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Verification document file to upload (PDF, JPEG, PNG, max 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document file uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid MIME type, mismatched extension, or size limit exceeded (max 10MB)',
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    return this.uploadsService.saveDocument(file);
  }
}
