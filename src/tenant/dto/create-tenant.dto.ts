import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  alternatePhone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  tenantType?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  roomId: number;

  @IsNumber()
  @IsNotEmpty()
  propertyId: number;

  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @IsDateString()
  @IsOptional()
  checkOutDate?: string;

  @IsDateString()
  @IsOptional()
  addRentOn?: string;

  @IsString()
  @IsOptional()
  agreementPeriod?: string;

  @IsString()
  @IsOptional()
  lockInPeriod?: string;
}
