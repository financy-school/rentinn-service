import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { Payment } from '../rentals/entities/payment.entity';
import { Property } from '../properties/entities/property.entity';
import { Room } from '../properties/entities/room.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Invoice, InvoiceStatus } from '../finance/entities/invoice.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { KycStatus } from '../common/enums/kyc-status.enum';
import { Tenant } from '../tenant/entities/tenant.entity';
import {
  DashboardAnalyticsQueryDto,
  DateRangeEnum,
} from './dto/analytics-query.dto';

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
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(query: DashboardAnalyticsQueryDto, user: any) {
    const { property_id, date_range, start_date, end_date } = query;
    const landlordId = user.user_id;

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
      this.getPropertyInfo(landlordId, property_id),
      this.getOccupancyStatistics(landlordId, property_id),
      this.getRentCollectionStats(landlordId, startDate, endDate, property_id),
      this.getRevenueTrendsData(landlordId, property_id, 5),
      this.getProfitLossData(landlordId, startDate, endDate, property_id),
      this.getIssuesMaintenanceData(landlordId, property_id),
      this.getTenantInfoData(landlordId),
      this.getRoomOccupancyMapData(landlordId, property_id),
    ]);

    return {
      property_info: propertyInfo,
      occupancy: {
        occupancy_percentage: occupancyStats.occupancyRate,
        total_units: occupancyStats.totalRooms,
        occupied_units: occupancyStats.occupiedRooms,
        vacant_units: occupancyStats.vacantRooms,
        tenant_count: occupancyStats.totalTenants,
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
    const landlordId = user.user_id;
    const property_id = query.property_id ?? undefined;

    const occupancyStats = await this.getOccupancyStatistics(
      landlordId,
      property_id,
    );

    return {
      occupancy_percentage: occupancyStats.occupancyRate,
      total_units: occupancyStats.totalRooms,
      occupied_units: occupancyStats.occupiedRooms,
      vacant_units: occupancyStats.vacantRooms,
      tenant_count: occupancyStats.totalTenants,
    };
  }

  /**
   * Get revenue trends
   */
  async getRevenueTrends(query: any, user: any) {
    const landlordId = user.user_id;
    const property_id = query.property_id ?? undefined;
    const months = query.months || 5;

    return await this.getRevenueTrendsData(landlordId, property_id, months);
  }

  /**
   * Get profit and loss analytics
   */
  async getProfitLossAnalytics(query: any, user: any) {
    const landlordId = user.user_id;
    const property_id = query.property_id ?? undefined;
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
      property_id,
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
  private async getPropertyInfo(landlordId: string, property_id?: string) {
    if (property_id && property_id !== 'all') {
      const property = await this.propertyRepository.findOne({
        where: { property_id, owner_id: landlordId },
      });

      if (!property) {
        throw new Error('Property not found');
      }

      const totalUnits = await this.roomRepository.count({
        where: { property: { property_id: property_id } },
      });

      return {
        property_id: property.property_id,
        property_name: property.name,
        location: `${property.city}, ${property.state}`,
        total_units: totalUnits,
        real_time_tracking_enabled: true, // Assuming this is always enabled
      };
    } else {
      // Return aggregated info for all properties
      // const properties = await this.propertyRepository.find({
      //   where: { ownerId: landlordId },
      // });

      const totalUnits = await this.roomRepository
        .createQueryBuilder('room')
        .innerJoin('room.property', 'property')
        .where('property.owner_id = :landlordId', { landlordId })
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
    landlordId: string,
    startDate: Date,
    endDate: Date,
    property_id?: string,
  ) {
    const rentalStats = await this.getRentalIncomeStatistics(
      landlordId,
      startDate,
      endDate,
      property_id,
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
    landlordId: string,
    property_id?: string,
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
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('payment.paymentDate >= :monthsAgo', { monthsAgo });

    if (property_id && property_id !== 'all') {
      monthlyIncomeQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
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
    landlordId: string,
    startDate: Date,
    endDate: Date,
    property_id?: string,
  ) {
    // Get revenue data
    const rentalStats = await this.getRentalIncomeStatistics(
      landlordId,
      startDate,
      endDate,
      property_id,
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

    if (!property_id) {
      // Get all properties
      const properties = await this.propertyRepository.find({
        where: { owner_id: landlordId },
      });

      propertyBreakdown = await Promise.all(
        properties.map(async (property) => {
          const propertyRevenue = await this.getRentalIncomeStatistics(
            landlordId,
            startDate,
            endDate,
            property.property_id,
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
   * Get issues and maintenance data (improved)
   */
  private async getIssuesMaintenanceData(
    landlordId: string,
    property_id?: string,
  ) {
    // Query tickets directly for accurate counts
    const ticketsQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.user_id = :landlordId', { landlordId });

    if (property_id && property_id !== 'all') {
      ticketsQuery.andWhere('ticket.property_id = :property_id', {
        property_id,
      });
    }

    const allTickets = await ticketsQuery.getMany();

    const total_issues = allTickets.length;
    const open_issues = allTickets.filter(
      (ticket: Ticket) => ticket.status === 'PENDING',
    ).length;
    const resolved_issues = allTickets.filter(
      (ticket: Ticket) => ticket.status === 'CLOSED',
    ).length;
    const in_progress_issues = allTickets.filter(
      (ticket: Ticket) => ticket.status === 'IN_PROGRESS',
    ).length;

    // Get recent issues (last 5)
    const recent_issues = allTickets
      .sort(
        (a: Ticket, b: Ticket) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((issue: Ticket) => ({
        issue_id: issue.ticket_id,
        title: issue.issue,
        priority: 'high', // Could be enhanced with priority field
        status: issue.status.toLowerCase(),
        room_number: issue.room_id,
        reported_date: issue.createdAt.toISOString(),
      }));

    return {
      total_issues,
      open_issues,
      in_progress_issues,
      resolved_issues,
      recent_issues,
    };
  }

  /**
   * Get tenant info data
   */
  private async getTenantInfoData(landlordId: string) {
    // const tenantStats = await this.getTenantStatistics(landlordId);

    // Get real KYC stats
    const kycQuery = this.kycRepository
      .createQueryBuilder('kyc')
      .leftJoinAndSelect('kyc.tenant', 'tenant')
      .where('kyc.user_id = :landlordId', { landlordId });

    const allKyc = await kycQuery.getMany();

    const verified = allKyc.filter(
      (kyc: Kyc) => kyc.status === KycStatus.VERIFIED,
    ).length;
    const pending = allKyc.filter(
      (kyc: Kyc) => kyc.status === KycStatus.PENDING,
    ).length;
    const rejected = allKyc.filter(
      (kyc: Kyc) => kyc.status === KycStatus.REJECTED,
    ).length;

    const recentKycSubmissions = allKyc
      .sort(
        (a: Kyc, b: Kyc) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 3)
      .map((kyc: Kyc) => ({
        kyc_id: kyc.kyc_id,
        tenant_id: kyc.tenant_id,
        status: kyc.status.toLowerCase(),
        submitted_date: kyc.createdAt.toISOString(),
        tenant_name: kyc.tenant ? kyc.tenant.name : 'N/A',
        room_number: kyc.tenant?.room_id || 'N/A',
      }));

    // Get top tenants based on payment behavior
    const topTenantsQuery = this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.rentals', 'rental')
      .leftJoinAndSelect('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .limit(3);

    const topTenants = await topTenantsQuery.getMany();

    const topTenantsData = topTenants.map((tenant, index) => ({
      tenant_id: tenant.tenant_id,
      name: tenant.name,
      room_number: tenant.rentals[0]?.room.room_id,
      payment_status: 'on_time',
      ranking: index + 1,
    }));

    return {
      kyc_stats: {
        verified,
        pending,
        rejected,
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
    property_id?: string,
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
      .where('property.owner_id = :landlordId', { landlordId });

    if (property_id && property_id !== 'all') {
      roomsQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
    }

    const rooms = await roomsQuery.getMany();

    const occupiedRooms = rooms.filter(
      (room) =>
        room.rentals && room.rentals.length >= (room.available_count || 1),
    ).length;

    const roomsData = await Promise.all(
      rooms.map(async (room) => {
        const openTickets = await this.ticketRepository.count({
          where: {
            room_id: room.room_id,
            status: 'PENDING',
          },
        });

        return {
          room_number: room.room_id,
          status:
            room.rentals && room.rentals.length >= (room.available_count || 1)
              ? 'occupied'
              : 'vacant',
          has_issues: openTickets > 0,
          floor: Math.floor(room.floorNumber || 0),
          property_id: room.property_id,
        };
      }),
    );

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
    property_id?: string,
  ) {
    const roomsQuery = this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :ownerId', { ownerId: landlordId });

    if (property_id && property_id !== 'all') {
      roomsQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
    }

    const totalRooms = await roomsQuery.getCount();

    const roomsWithRentalsQuery = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect(
        'room.rentals',
        'rental',
        'rental.isActive = :isActive',
        { isActive: true },
      )
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId });

    if (property_id && property_id !== 'all') {
      roomsWithRentalsQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
    }

    const roomsWithRentals = await roomsWithRentalsQuery.getMany();
    const occupiedRooms = roomsWithRentals.filter(
      (room) =>
        room.rentals && room.rentals.length >= (room.available_count || 1),
    ).length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate =
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    const tenantCountQuery = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });

    if (property_id && property_id !== 'all') {
      tenantCountQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
    }

    const totalTenants = await tenantCountQuery.getCount();

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      totalTenants,
    };
  }

  private async getRentalIncomeStatistics(
    landlordId: string,
    startDate: Date,
    endDate: Date,
    property_id?: string,
  ) {
    const rentalsQuery = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });

    if (property_id && property_id !== 'all') {
      rentalsQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
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
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (property_id && property_id !== 'all') {
      paymentsQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
    }

    const paymentsResult = await paymentsQuery
      .select('SUM(payment.amount)', 'totalPayments')
      .getRawOne();

    const actualIncome = Number(paymentsResult?.totalPayments || 0);

    const overdueQuery = this.invoiceRepository
      .createQueryBuilder('invoice')
      .innerJoin('invoice.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere(
        '(invoice.status = :overdueStatus OR (invoice.due_date < CURDATE() AND invoice.outstanding_amount > 0))',
        { overdueStatus: InvoiceStatus.OVERDUE },
      );

    if (property_id && property_id !== 'all') {
      overdueQuery.andWhere('property.property_id = :property_id', {
        property_id,
      });
    }

    const overdueResult = await overdueQuery
      .select('SUM(invoice.outstanding_amount)', 'totalOutstanding')
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

  private async getTenantStatistics(landlordId: string) {
    const tenantsQuery = this.tenantRepository
      .createQueryBuilder('tenant')
      .innerJoin('tenant.rentals', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });

    const totalTenants = await tenantsQuery
      .distinctOn(['tenant.tenant_id'])
      .getCount();

    const overdueTenantsQuery = this.tenantRepository
      .createQueryBuilder('tenant')
      .innerJoin('tenant.rentals', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.owner_id = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.paymentStatus = :status', {
        status: PaymentStatus.OVERDUE,
      });

    const overdueTenants = await overdueTenantsQuery
      .distinctOn(['tenant.tenant_id'])
      .getCount();

    return {
      totalTenants,
      overdueTenants,
      tenantRetentionRate: 0,
      overdueTenantRate:
        totalTenants > 0 ? (overdueTenants / totalTenants) * 100 : 0,
    };
  }
}
