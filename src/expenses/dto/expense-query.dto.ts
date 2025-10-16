import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ExpenseStatus, ExpensePriority } from '../entities/expense.entity';

export enum ExpenseSortBy {
  DATE = 'date',
  AMOUNT = 'amount',
  DUE_DATE = 'due_date',
  STATUS = 'status',
  PRIORITY = 'priority',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ExpenseQueryDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsEnum(ExpensePriority)
  priority?: ExpensePriority;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(ExpenseSortBy)
  sort_by?: ExpenseSortBy = ExpenseSortBy.DATE;

  @IsOptional()
  @IsEnum(SortOrder)
  sort_order?: SortOrder = SortOrder.DESC;
}

export class ExpenseAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  property_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export interface ExpenseSummaryDto {
  total_expenses: number;
  paid_amount: number;
  outstanding_amount: number;
  pending_count: number;
  overdue_count: number;
  this_month_expenses: number;
  average_expense: number;
}

export interface CategoryExpenseDto {
  category_id: string;
  category_name: string;
  total_amount: number;
  expense_count: number;
  percentage: number;
}

export interface MonthlyExpenseDto {
  month: string;
  total: number;
  paid: number;
  pending: number;
}

export interface VendorExpenseDto {
  vendor_name: string;
  total_amount: number;
  expense_count: number;
}

export interface ExpenseAnalyticsResponseDto {
  summary: ExpenseSummaryDto;
  by_category: CategoryExpenseDto[];
  by_month: MonthlyExpenseDto[];
  top_vendors: VendorExpenseDto[];
  upcoming_dues: any[];
}
