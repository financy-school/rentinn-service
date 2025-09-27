import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsDate,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
import { InvoiceStatus } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsString()
  tenant_id: string; // Changed to string for UUID

  @IsOptional()
  @IsNumber()
  landlordId?: number;

  @IsOptional()
  @IsString()
  rental_id?: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  issueDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringFrequency?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextRecurringDate?: Date;

  @IsOptional()
  @IsBoolean()
  sendReminder?: boolean;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
