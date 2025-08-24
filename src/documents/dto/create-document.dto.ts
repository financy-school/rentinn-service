import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  IsObject,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsString()
  file_name: string;

  @IsString()
  file_type: string;

  @IsString()
  descriptor: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsBoolean()
  is_signature_required: boolean;

  @IsOptional()
  @IsBoolean()
  is_signed?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  signed_at?: Date;

  @IsString()
  doc_type: string;

  @IsOptional()
  @IsUrl()
  download_url?: string;

  @IsOptional()
  @IsBoolean()
  is_file_prefix_required?: boolean;
}
