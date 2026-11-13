import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class UploadResponseDto {
  @ApiProperty({
    example: '/uploads/images/3f8251e6-4299-4d6d-88b0-a6167c13e5d3.jpg',
    description: 'Public relative URL for accessing the stored file',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiProperty({
    example: '3f8251e6-4299-4d6d-88b0-a6167c13e5d3.jpg',
    description: 'Unique secure filename assigned on disk',
  })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    example: 1048576,
    description: 'File size in bytes',
  })
  @IsInt()
  @IsPositive()
  size!: number;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the uploaded file',
  })
  @IsString()
  @IsNotEmpty()
  mimetype!: string;

  constructor(partial?: Partial<UploadResponseDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
