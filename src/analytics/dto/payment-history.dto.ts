import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum PaymentStatusFilter {
  ALL = 'all',
  PAID = 'paid',
  PENDING = 'pending',
  OVERDUE = 'overdue',
}

export enum PaymentCategoryFilter {
  ALL = 'all',
  RENT = 'rent',
  DEPOSIT = 'deposit',
  MAINTENANCE = 'maintenance',
  UTILITY = 'utility',
  OTHER = 'other',
}

export enum PaymentSortBy {
  DATE = 'date',
  AMOUNT = 'amount',
  TENANT = 'tenant',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaymentHistoryQueryDto {
  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsEnum(PaymentStatusFilter)
  status?: PaymentStatusFilter = PaymentStatusFilter.ALL;

  @IsOptional()
  @IsEnum(PaymentCategoryFilter)
  category?: PaymentCategoryFilter = PaymentCategoryFilter.ALL;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(PaymentSortBy)
  sortBy?: PaymentSortBy = PaymentSortBy.DATE;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export interface PaymentRecordDto {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  category: string;
  date: string;
  dueDate: string;
  description: string;
  status: string;
  paymentMethod: string;
  transactionId: string;
  receiptNumber: string;
  receiptUrl: string;
  notes: string;
  isLatePayment: boolean;
  lateFee: number;
  createdAt: string;
}

export interface PaymentSummaryDto {
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthReceived: number;
}

export interface PaymentHistoryResponseDto {
  summary: PaymentSummaryDto;
  payments: PaymentRecordDto[];
  total: number;
}
