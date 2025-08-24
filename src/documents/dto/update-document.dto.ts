import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { DOC_TYPE } from '../entities/document.entity';

export class UpdateDocumentDto {
  @IsNotEmpty()
  @IsString()
  readonly file_name: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly descriptor: string;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  readonly is_verification_required?: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  readonly is_signature_required?: boolean;

  @IsNotEmpty()
  @IsObject()
  @IsOptional()
  readonly verification_data?: object;

  @IsNotEmpty()
  @IsEnum(DOC_TYPE)
  @IsString()
  @IsOptional()
  readonly doc_type: string;
}

export class RemoveDocumentDto {
  @IsNotEmpty()
  @IsEnum(DOC_TYPE)
  @IsString()
  readonly doc_type: string;
}
