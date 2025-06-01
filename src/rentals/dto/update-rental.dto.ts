import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class UpdateRentalDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  rentAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  securityDeposit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  outstandingAmount?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  leaseDocumentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isSecurityDepositPaid?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  rentDueDay?: number;
}
