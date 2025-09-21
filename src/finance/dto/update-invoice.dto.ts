import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { CreateInvoiceDto } from './create-invoice.dto';
import { InvoiceStatus } from '../entities/invoice.entity';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  totalAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  outstandingAmount?: number;
}
