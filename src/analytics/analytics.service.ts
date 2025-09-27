import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { Payment } from '../rentals/entities/payment.entity';
import { Property } from '../properties/entities/property.entity';
import { Room } from '../properties/entities/room.entity';
import { User } from '../users/entities/user.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import {
  DashboardAnalyticsQueryDto,
  DateRangeEnum,
} from './dto/analytics-query.dto';
import { Tenant } from '../entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(query: DashboardAnalyticsQueryDto, user: any) {
    const { property_id, date_range, start_date, end_date } = query;
    const landlordId = user.id;

    // Convert property_id string to number if provided
    const propertyId = property_id ? parseInt(property_id, 10) : undefined;

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(
      date_range,
      start_date,
      end_date,
    );

    // Get all analytics components
    const [
      propertyInfo,
      occupancyStats,
      rentCollectionStats,
      revenueTrendsData,
      profitLossData,
      issuesMaintenanceData,
      tenantInfoData,
      roomOccupancyMapData,
    ] = await Promise.all([
      this.getPropertyInfo(landlordId, propertyId),
      this.getOccupancyStatistics(landlordId, propertyId),
      this.getRentCollectionStats(landlordId, startDate, endDate, propertyId),
      this.getRevenueTrendsData(landlordId, propertyId, 5),
      this.getProfitLossData(landlordId, startDate, endDate, propertyId),
      this.getIssuesMaintenanceData(landlordId, propertyId),
      this.getTenantInfoData(landlordId),
      this.getRoomOccupancyMapData(landlordId, propertyId),
    ]);

    return {
      property_info: propertyInfo,
      occupancy: {
        occupancy_percentage: occupancyStats.occupancyRate,
        total_units: occupancyStats.totalRooms,
        occupied_units: occupancyStats.occupiedRooms,
        vacant_units: occupancyStats.vacantRooms,
        tenant_count: occupancyStats.occupiedRooms, // Assuming one tenant per room
      },
      rent_collection: rentCollectionStats,
      revenue_trends: revenueTrendsData,
      profit_loss: profitLossData,
      issues_maintenance: issuesMaintenanceData,
      tenant_info: tenantInfoData,
      room_occupancy_map: roomOccupancyMapData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get occupancy analytics
   */
  async getOccupancyAnalytics(query: any, user: any) {
    const landlordId = user.id;
    const propertyId = query.property_id
      ? parseInt(query.property_id, 10)
      : undefined;

    const occupancyStats = await this.getOccupancyStatistics(
      landlordId,
      propertyId,
    );

    return {
      occupancy_percentage: occupancyStats.occupancyRate,
      total_units: occupancyStats.totalRooms,
      occupied_units: occupancyStats.occupiedRooms,
      vacant_units: occupancyStats.vacantRooms,
      tenant_count: occupancyStats.occupiedRooms,
    };
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(query: any, user: any) {
    const landlordId = user.id;
    const propertyId = query.property_id
      ? parseInt(query.property_id, 10)
      : undefined;
    const months = query.months || 5;

    return await this.getRevenueTrendsData(landlordId, propertyId, months);
  }

  /**
   * Get profit and loss analytics
   */
  async getProfitLossAnalytics(query: any, user: any) {
    const landlordId = user.id;
    const propertyId = query.property_id
      ? parseInt(query.property_id, 10)
      : undefined;
    const { date_range, start_date, end_date } = query;

    const { startDate, endDate } = this.calculateDateRange(
      date_range,
      start_date,
      end_date,
    );

    return await this.getProfitLossData(
      landlordId,
      startDate,
      endDate,
      propertyId,
    );
  }

  /**
   * Helper method to calculate date range
   */
  private calculateDateRange(
    dateRange: DateRangeEnum,
    startDate?: string,
    endDate?: string,
  ) {
    const now = new Date();
    let start: Date, end: Date;

    switch (dateRange) {
      case DateRangeEnum.CURRENT_MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case DateRangeEnum.LAST_MONTH:
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case DateRangeEnum.LAST_3_MONTHS:
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case DateRangeEnum.LAST_6_MONTHS:
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case DateRangeEnum.LAST_YEAR:
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case DateRangeEnum.CUSTOM:
        start = startDate
          ? new Date(startDate)
          : new Date(now.getFullYear(), now.getMonth(), 1);
        end = endDate
          ? new Date(endDate)
          : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        // start = new Date(now.getFullYear(), now.getMonth(), 1);
        // end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate: start, endDate: end };
  }

  /**
   * Get property information
   */
  private async getPropertyInfo(landlordId: number, propertyId?: number) {
    if (propertyId) {
      const property = await this.propertyRepository.findOne({
        where: { id: propertyId, ownerId: landlordId },
      });

      if (!property) {
        throw new Error('Property not found');
      }

      const totalUnits = await this.roomRepository.count({
        where: { property: { id: propertyId } },
      });

      return {
        property_id: property.id.toString(),
        property_name: property.name,
        location: `${property.city}, ${property.state}`,
        total_units: totalUnits,
        real_time_tracking_enabled: true, // Assuming this is always enabled
      };
    } else {
      // Return aggregated info for all properties
      const properties = await this.propertyRepository.find({
        where: { ownerId: landlordId },
      });

      const totalUnits = await this.roomRepository
        .createQueryBuilder('room')
        .innerJoin('room.property', 'property')
        .where('property.ownerId = :landlordId', { landlordId })
        .getCount();

      return {
        property_id: null,
        property_name: 'All Properties',
        location: 'Multiple Locations',
        total_units: totalUnits,
        real_time_tracking_enabled: true,
      };
    }
  }

  /**
   * Get rent collection statistics
   */
  private async getRentCollectionStats(
    landlordId: number,
    startDate: Date,
    endDate: Date,
    propertyId?: number,
  ) {
    const rentalStats = await this.getRentalIncomeStatistics(
      landlordId,
      startDate,
      endDate,
      propertyId,
    );

    const collectionRate =
      rentalStats.expectedIncome > 0
        ? (rentalStats.actualIncome / rentalStats.expectedIncome) * 100
        : null;

    const collectedPercentage =
      rentalStats.expectedIncome > 0
        ? (rentalStats.actualIncome / rentalStats.expectedIncome) * 100
        : null;

    const overduePercentage =
      rentalStats.expectedIncome > 0
        ? (rentalStats.overdueIncome / rentalStats.expectedIncome) * 100
        : null;

    return {
      total_rent: rentalStats.expectedIncome,
      collected: rentalStats.actualIncome,
      overdue: rentalStats.overdueIncome,
      collection_rate: collectionRate,
      collected_percentage: collectedPercentage,
      overdue_percentage: overduePercentage,
    };
  }

  /**
   * Get revenue trends data
   */
  private async getRevenueTrendsData(
    landlordId: number,
    propertyId?: number,
    months: number = 5,
  ) {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);
    monthsAgo.setDate(1);

    const monthlyIncomeQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate >= :monthsAgo', { monthsAgo });

    if (propertyId) {
      monthlyIncomeQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const monthlyIncomeResult = await monthlyIncomeQuery
      .select("DATE_FORMAT(payment.paymentDate, '%Y-%m-01')", 'month')
      .addSelect('SUM(payment.amount)', 'revenue')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    // Calculate vacancy losses (simplified as 10% of expected revenue)
    const monthlyData = monthlyIncomeResult.map((item) => ({
      month: new Date(item.month).toLocaleDateString('en-US', {
        month: 'short',
      }),
      revenue: Number(item.revenue),
      vacancy_loss: Math.round(Number(item.revenue) * 0.1), // Simplified calculation
      year: new Date(item.month).getFullYear(),
    }));

    const avgRevenue =
      monthlyData.length > 0
        ? Math.round(
            monthlyData.reduce((sum, month) => sum + month.revenue, 0) /
              monthlyData.length,
          )
        : 0;

    const avgLoss =
      monthlyData.length > 0
        ? Math.round(
            monthlyData.reduce((sum, month) => sum + month.vacancy_loss, 0) /
              monthlyData.length,
          )
        : 0;

    return {
      avg_revenue: avgRevenue,
      avg_loss: avgLoss,
      monthly_data: monthlyData,
    };
  }

  /**
   * Get profit and loss data
   */
  private async getProfitLossData(
    landlordId: number,
    startDate: Date,
    endDate: Date,
    propertyId?: number,
  ) {
    // Get revenue data
    const rentalStats = await this.getRentalIncomeStatistics(
      landlordId,
      startDate,
      endDate,
      propertyId,
    );

    // Calculate simplified expenses (30% of revenue)
    const totalExpenses = Math.round(rentalStats.actualIncome * 0.3);
    const netProfit = rentalStats.actualIncome - totalExpenses;

    // Get property breakdown
    interface PropertyBreakdownItem {
      property_name: string;
      revenue: number;
      expenses: number;
      net_profit: number;
    }
    let propertyBreakdown: PropertyBreakdownItem[] = [];

    if (!propertyId) {
      // Get all properties
      const properties = await this.propertyRepository.find({
        where: { ownerId: landlordId },
      });

      propertyBreakdown = await Promise.all(
        properties.map(async (property) => {
          const propertyRevenue = await this.getRentalIncomeStatistics(
            landlordId,
            startDate,
            endDate,
            property.id,
          );
          const propertyExpenses = Math.round(
            propertyRevenue.actualIncome * 0.3,
          );

          return {
            property_name: property.name,
            revenue: propertyRevenue.actualIncome,
            expenses: propertyExpenses,
            net_profit: propertyRevenue.actualIncome - propertyExpenses,
          };
        }),
      );
    }

    // Expense breakdown (simplified percentages)
    const expenseBreakdown = {
      electricity: {
        amount: Math.round(totalExpenses * 0.31),
        percentage: 31,
      },
      water: {
        amount: Math.round(totalExpenses * 0.14),
        percentage: 14,
      },
      services: {
        amount: Math.round(totalExpenses * 0.19),
        percentage: 19,
      },
      repairs: {
        amount: Math.round(totalExpenses * 0.25),
        percentage: 25,
      },
      other: {
        amount: Math.round(totalExpenses * 0.11),
        percentage: 11,
      },
    };

    interface ProfitLossSummary {
      total_revenue: number;
      total_expenses: number;
      net_profit: number;
    }

    interface PropertyBreakdownItem {
      property_name: string;
      revenue: number;
      expenses: number;
      net_profit: number;
    }

    interface ExpenseBreakdownItem {
      amount: number;
      percentage: number;
    }

    interface ExpenseBreakdown {
      electricity: ExpenseBreakdownItem;
      water: ExpenseBreakdownItem;
      services: ExpenseBreakdownItem;
      repairs: ExpenseBreakdownItem;
      other: ExpenseBreakdownItem;
    }

    interface ProfitLossData {
      summary: ProfitLossSummary;
      property_breakdown: PropertyBreakdownItem[];
      expense_breakdown: ExpenseBreakdown;
    }

    const result: ProfitLossData = {
      summary: {
        total_revenue: rentalStats.actualIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
      },
      property_breakdown: propertyBreakdown,
      expense_breakdown: expenseBreakdown,
    };

    return result;
  }

  /**
   * Get issues and maintenance data (simplified)
   */
  private async getIssuesMaintenanceData(
    landlordId: number,
    propertyId?: number,
  ) {
    // This would require an Issues/Maintenance entity, for now returning mock data
    return {
      total_issues: 3,
      open_issues: 2,
      in_progress_issues: 1,
      resolved_issues: 0,
      recent_issues: [
        {
          issue_id: '201',
          title: 'Leaky Faucet - 201',
          priority: 'high',
          status: 'open',
          room_number: '201',
          reported_date: new Date().toISOString(),
        },
      ],
    };
  }

  /**
   * Get tenant info data
   */
  private async getTenantInfoData(landlordId: number) {
    const tenantStats = await this.getTenantStatistics(landlordId);

    // Get recent KYC submissions (mock data for now)
    const recentKycSubmissions = [
      {
        tenant_name: 'Ravi Kumar',
        submission_date: '2025-08-30',
        status: 'verified',
      },
    ];

    // Get top tenants based on payment behavior
    const topTenantsQuery = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .limit(3);

    const topTenants = await topTenantsQuery.getMany();

    const topTenantsData = topTenants.map((tenant, index) => ({
      tenant_id: tenant.id.toString(),
      name: tenant.fullName,
      room_number: '201', // Would need to get actual room number
      payment_status: 'on_time', // Would need to calculate actual status
      ranking: index + 1,
    }));

    return {
      kyc_stats: {
        verified: 12,
        pending: 3,
        rejected: 1,
      },
      top_tenants: topTenantsData,
      recent_kyc_submissions: recentKycSubmissions,
    };
  }

  /**
   * Get room occupancy map data
   */
  private async getRoomOccupancyMapData(
    landlordId: number,
    propertyId?: number,
  ) {
    const roomsQuery = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect(
        'room.rentals',
        'rental',
        'rental.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('rental.tenant', 'tenant')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId });

    if (propertyId) {
      roomsQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const rooms = await roomsQuery.getMany();

    const occupiedRooms = rooms.filter(
      (room) => room.rentals && room.rentals.length > 0,
    ).length;

    const roomsData = rooms.map((room) => {
      const hasActiveRental = room.rentals && room.rentals.length > 0;
      const tenant = hasActiveRental ? room.rentals[0].tenant : null;

      return {
        room_number: room.id,
        status: hasActiveRental ? 'occupied' : 'vacant',
        tenant_name: tenant ? tenant.fullName : undefined,
        has_issues: false, // Would need to check against issues table
        floor: Math.floor(room.id / 100), // Extract floor from room number
      };
    });

    return {
      total_rooms: rooms.length,
      occupied_rooms: occupiedRooms,
      vacant_rooms: rooms.length - occupiedRooms,
      rooms: roomsData,
    };
  }

  // Keep existing private methods from original service
  private async getOccupancyStatistics(
    landlordId: number,
    propertyId?: number,
  ) {
    const roomsQuery = this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :ownerId', { ownerId: landlordId });

    if (propertyId) {
      roomsQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const totalRooms = await roomsQuery.getCount();

    const occupiedQuery = this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .innerJoin('room.rentals', 'rental')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });

    if (propertyId) {
      occupiedQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const occupiedRooms = await occupiedQuery.getCount();
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
    };
  }

  private async getRentalIncomeStatistics(
    landlordId: number,
    startDate: Date,
    endDate: Date,
    propertyId?: number,
  ) {
    const rentalsQuery = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });

    if (propertyId) {
      rentalsQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const activeRentals = await rentalsQuery.getMany();

    let expectedIncome = 0;
    activeRentals.forEach((rental) => {
      expectedIncome += rental.rentAmount;
    });

    const paymentsQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (propertyId) {
      paymentsQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const paymentsResult = await paymentsQuery
      .select('SUM(payment.amount)', 'totalPayments')
      .getRawOne();

    const actualIncome = Number(paymentsResult?.totalPayments || 0);

    const overdueQuery = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.paymentStatus != :paidStatus', {
        paidStatus: PaymentStatus.PAID,
      });

    if (propertyId) {
      overdueQuery.andWhere('property.id = :propertyId', { propertyId });
    }

    const overdueResult = await overdueQuery
      .select('SUM(rental.outstandingAmount)', 'totalOutstanding')
      .getRawOne();

    const overdueIncome = Number(overdueResult?.totalOutstanding || 0);

    return {
      expectedIncome,
      actualIncome,
      overdueIncome,
      collectionRate:
        expectedIncome > 0 ? (actualIncome / expectedIncome) * 100 : 0,
    };
  }

  private async getTenantStatistics(landlordId: number) {
    const tenantsQuery = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });

    const totalTenants = await tenantsQuery.distinctOn(['user.id']).getCount();

    const overdueTenantsQuery = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.paymentStatus = :status', {
        status: PaymentStatus.OVERDUE,
      });

    const overdueTenants = await overdueTenantsQuery
      .distinctOn(['user.id'])
      .getCount();

    return {
      totalTenants,
      overdueTenants,
      tenantRetentionRate: 0, // Would need more complex calculation
      overdueTenantRate:
        totalTenants > 0 ? (overdueTenants / totalTenants) * 100 : 0,
    };
  }
}
