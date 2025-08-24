import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  floorNumber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedroomCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathroomCount?: number;

  @IsOptional()
  @IsBoolean()
  isFurnished?: boolean;

  @IsOptional()
  @IsString()
  amenities?: string;

  @IsOptional()
  @IsArray()
  image_document_id_list?: string[];
}
