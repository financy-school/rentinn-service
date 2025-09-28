import { IsOptional, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => String)
  property_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? 1 : Math.max(1, num);
  })
  page: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? 10 : Math.max(1, num);
  })
  limit: number;
}
