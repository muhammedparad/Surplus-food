import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class VerificationDocumentDto {
  @ApiProperty({
    example: 'FOOD_SAFETY_LICENSE',
    description: 'Document classification, e.g., FOOD_SAFETY_LICENSE, NGO_CHARTER, TAX_EXEMPTION, ID_CARD',
  })
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @ApiProperty({
    example: 'https://storage.example.com/docs/fssai-license.pdf',
    description: 'URL of uploaded certificate or license',
  })
  @IsUrl({ require_tld: false })
  fileUrl!: string;
}

export class SubmitVerificationDto {
  @ApiPropertyOptional({
    example: 'd9b2b63d-a4c3-4d2d-8fa0-6f920da68181',
    description: 'Organization ID being submitted for verification (Restaurant or NGO)',
  })
  @IsOptional()
  @IsUUID('4')
  organizationId?: string;

  @ApiPropertyOptional({
    example: 'c8a1b63d-a4c3-4d2d-8fa0-6f920da68192',
    description: 'Volunteer profile ID being submitted for verification',
  })
  @IsOptional()
  @IsUUID('4')
  volunteerProfileId?: string;

  @ApiProperty({
    type: [VerificationDocumentDto],
    description: 'One or more official verification documents/licenses',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  documents!: VerificationDocumentDto[];
}
