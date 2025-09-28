import {
  IsDateString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  alternate_phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  tenantType?: string;

  @IsString()
  @IsOptional()
  idProofType?: string;

  @IsString()
  @IsOptional()
  idProofNumber?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @Type(() => String)
  room_id?: string;

  @IsDateString()
  @IsOptional()
  checkInDate?: string;

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

  @IsObject()
  @IsOptional()
  image_id_list?: string[];
}
