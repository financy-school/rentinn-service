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
  phoneNumber: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  idProofType: string;

  @IsString()
  @IsNotEmpty()
  idProofNumber: string;

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
}
