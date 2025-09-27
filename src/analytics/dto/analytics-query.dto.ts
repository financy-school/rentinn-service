import {
  IsDateString,
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum DateRangeEnum {
  CURRENT_MONTH = 'current_month',
  LAST_MONTH = 'last_month',
  LAST_3_MONTHS = 'last_3_months',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export class DashboardAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsOptional()
  @IsEnum(DateRangeEnum)
  date_range?: DateRangeEnum = DateRangeEnum.CURRENT_MONTH;

  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.date_range === DateRangeEnum.CUSTOM)
  start_date?: string;

  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.date_range === DateRangeEnum.CUSTOM)
  end_date?: string;
}

export class OccupancyAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsOptional()
  @IsEnum(DateRangeEnum)
  date_range?: DateRangeEnum = DateRangeEnum.CURRENT_MONTH;
}

export class RevenueTrendsQueryDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => parseInt(value))
  months?: number = 5;
}

export class ProfitLossAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsOptional()
  @IsEnum(DateRangeEnum)
  date_range?: DateRangeEnum = DateRangeEnum.CURRENT_MONTH;
}

// Response DTOs for Swagger documentation
export class PropertyInfoDto {
  property_id: string | null;

  property_name: string;

  location: string;

  total_units: number;

  real_time_tracking_enabled: boolean;
}

export class OccupancyDto {
  occupancy_percentage: number;

  total_units: number;

  occupied_units: number;

  vacant_units: number;

  tenant_count: number;
}

export class RentCollectionDto {
  total_rent: number;

  collected: number;

  overdue: number;

  collection_rate: number | null;

  collected_percentage: number | null;

  overdue_percentage: number | null;
}

export class MonthlyDataDto {
  month: string;

  revenue: number;

  vacancy_loss: number;

  year: number;
}

export class RevenueTrendsDto {
  avg_revenue: number;

  avg_loss: number;

  monthly_data: MonthlyDataDto[];
}

export class DashboardAnalyticsResponseDto {
  property_info: PropertyInfoDto;

  occupancy: OccupancyDto;

  rent_collection: RentCollectionDto;

  revenue_trends: RevenueTrendsDto;

  timestamp: string;
}
