import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum RevenuePeriod {
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
  CUSTOM = 'custom',
}

export class RevenueOverviewQueryDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(RevenuePeriod)
  period?: RevenuePeriod = RevenuePeriod.MONTH;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface MonthlyTrendDto {
  month: string;
  amount: number;
  received: number;
  pending: number;
}

export interface CategoryBreakdownDto {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TopTenantDto {
  tenantId: string;

  name: string;
  property: string;
  amount: number;
  payments: number;
}

export interface RevenueOverviewResponseDto {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  averageMonthly: number;
  totalProperties: number;
  occupiedUnits: number;
  monthlyTrend: MonthlyTrendDto[];
  categoryBreakdown: CategoryBreakdownDto[];
  topTenants: TopTenantDto[];
  growthPercentage: number;
  collectedAmount: number;
}
