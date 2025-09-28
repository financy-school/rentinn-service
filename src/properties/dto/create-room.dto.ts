import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  areaType?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  securityAmount?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsNumber()
  floorNumber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathroomCount?: number;

  @IsOptional()
  @IsNumber()
  lastElectricityReading?: number;

  @IsOptional()
  @IsDateString()
  lastElectricityReadingDate?: Date;

  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @IsOptional()
  @IsString()
  amenities?: string;

  @IsOptional()
  @IsArray()
  image_document_id_list?: string[];
}
