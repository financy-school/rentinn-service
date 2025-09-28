import { IsOptional, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => String)
  property_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 10))
  limit: number;
}
