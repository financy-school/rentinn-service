import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePropertyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalArea?: number;

  @IsOptional()
  @IsNumber()
  yearBuilt?: number;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsBoolean()
  isParkingAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isElevatorAvailable?: boolean;

  @IsOptional()
  @IsString()
  propertyTaxId?: string;

  @IsOptional()
  @IsString()
  insuranceDetails?: string;
}
