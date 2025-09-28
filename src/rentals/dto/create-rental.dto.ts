import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRentalDto {
  @IsNotEmpty()
  @IsString()
  tenant_id: string;

  @IsNotEmpty()
  @IsString()
  room_id: string;

  @IsNotEmpty()
  @IsString()
  property_id: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rentAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  securityDeposit?: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
