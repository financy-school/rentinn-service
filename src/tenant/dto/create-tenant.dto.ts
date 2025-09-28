import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsObject,
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
  phone_number: string;

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
  @IsNotEmpty()
  @Type(() => String)
  room_id: string;

  @IsString()
  @IsNotEmpty()
  property_id: string;

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

  @IsObject()
  @IsOptional()
  image_id_list?: string[];
}
