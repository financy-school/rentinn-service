import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsDate,
  IsObject,
  Min,
} from 'class-validator';
import { BillCategory } from '../entities/invoice-item.entity';

export class CreateInvoiceItemDto {
  @IsNotEmpty()
  @IsEnum(BillCategory)
  category: BillCategory;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  existingDues?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  existingDueDate?: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fixedAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
