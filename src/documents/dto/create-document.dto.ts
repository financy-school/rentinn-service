import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  file_name: string;

  @IsOptional()
  @IsString()
  file_type: string;

  @IsOptional()
  @IsString()
  descriptor: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_signature_required: boolean;

  @IsOptional()
  @IsBoolean()
  is_signed?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  signed_at?: Date;

  @IsOptional()
  @IsString()
  doc_type: string;

  @IsOptional()
  @IsString()
  download_url?: string;
}
