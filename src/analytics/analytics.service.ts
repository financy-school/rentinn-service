import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { Payment } from '../rentals/entities/payment.entity';
import { Property } from '../properties/entities/property.entity';
import { Room } from '../properties/entities/room.entity';
import { User } from '../users/entities/user.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';

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
  ) {}

  /**
   * Get dashboard overview analytics for a landlord
   */
  async getDashboardOverview(landlordId: number, queryDto: AnalyticsQueryDto) {
    const { startDate, endDate, propertyId } = queryDto;
    
    // Set default date range if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1st of last month
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Basic property statistics
    const propertyStats = await this.getPropertyStatistics(landlordId, propertyId);
    
    // Rental income statistics
    const incomeStats = await this.getRentalIncomeStatistics(landlordId, start, end, propertyId);
    
    // Occupancy statistics
    const occupancyStats = await this.getOccupancyStatistics(landlordId, propertyId);
    
    // Payment statistics
    const paymentStats = await this.getPaymentStatistics(landlordId, start, end, propertyId);
    
    // Tenant statistics
    const tenantStats = await this.getTenantStatistics(landlordId);
    
    return {
      propertyStats,
      incomeStats,
      occupancyStats,
      paymentStats,
      tenantStats,
      dateRange: {
        startDate: start,
        endDate: end,
      },
    };
  }

  /**
   * Get statistics about properties
   */
  private async getPropertyStatistics(landlordId: number, propertyId?: number) {
    // Build query
    const query = this.propertyRepository.createQueryBuilder('property')
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      query.andWhere('property.id = :propertyId', { propertyId });
    }
    
    // Count properties
    const totalProperties = await query.getCount();
    
    // Count rooms
    const roomsQuery = this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      roomsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const totalRooms = await roomsQuery.getCount();
    
    // Get total property value (sum of all rooms' rent)
    const valueQuery = this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      valueQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const totalValue = await valueQuery
      .select('SUM(room.rentAmount)', 'totalValue')
      .getRawOne();
    
    return {
      totalProperties,
      totalRooms,
      totalPropertyValue: Number(totalValue?.totalValue || 0),
      averageRoomValue: totalRooms > 0 ? Number(totalValue?.totalValue || 0) / totalRooms : 0,
    };
  }

  /**
   * Get rental income statistics
   */
  private async getRentalIncomeStatistics(
    landlordId: number, 
    startDate: Date, 
    endDate: Date, 
    propertyId?: number
  ) {
    // Calculate expected income for the period
    const rentalsQuery = this.rentalRepository.createQueryBuilder('rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });
    
    if (propertyId) {
      rentalsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const activeRentals = await rentalsQuery.getMany();
    
    // Calculate expected income based on active rentals during the period
    let expectedIncome = 0;
    activeRentals.forEach(rental => {
      expectedIncome += rental.rentAmount;
    });
    
    // Calculate actual income (sum of payments during the period)
    const paymentsQuery = this.paymentRepository.createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    
    if (propertyId) {
      paymentsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const paymentsResult = await paymentsQuery
      .select('SUM(payment.amount)', 'totalPayments')
      .getRawOne();
    
    const actualIncome = Number(paymentsResult?.totalPayments || 0);
    
    // Calculate overdue income
    const overdueQuery = this.rentalRepository.createQueryBuilder('rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.paymentStatus != :paidStatus', { paidStatus: PaymentStatus.PAID });
    
    if (propertyId) {
      overdueQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const overdueResult = await overdueQuery
      .select('SUM(rental.outstandingAmount)', 'totalOutstanding')
      .getRawOne();
    
    const overdueIncome = Number(overdueResult?.totalOutstanding || 0);
    
    // Calculate income trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // 1st of month
    
    const monthlyIncomeQuery = this.paymentRepository.createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate >= :sixMonthsAgo', { sixMonthsAgo });
    
    if (propertyId) {
      monthlyIncomeQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const monthlyIncomeResult = await monthlyIncomeQuery
      .select('DATE_TRUNC(\'month\', payment.paymentDate)', 'month')
      .addSelect('SUM(payment.amount)', 'total')
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();
    
    // Format monthly income data
    const monthlyIncome = monthlyIncomeResult.map(item => ({
      month: item.month,
      amount: Number(item.total),
    }));
    
    return {
      expectedIncome,
      actualIncome,
      overdueIncome,
      collectionRate: expectedIncome > 0 ? (actualIncome / expectedIncome) * 100 : 0,
      monthlyIncome,
    };
  }

  /**
   * Get occupancy statistics
   */
  private async getOccupancyStatistics(landlordId: number, propertyId?: number) {
    // Get total rooms
    const roomsQuery = this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      roomsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const totalRooms = await roomsQuery.getCount();
    
    // Get occupied rooms (with active rentals)
    const occupiedQuery = this.roomRepository.createQueryBuilder('room')
      .innerJoin('room.property', 'property')
      .innerJoin('room.rentals', 'rental')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });
    
    if (propertyId) {
      occupiedQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const occupiedRooms = await occupiedQuery.getCount();
    
    // Calculate vacant rooms
    const vacantRooms = totalRooms - occupiedRooms;
    
    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    // Get property-wise occupancy rates
    const propertyOccupancyQuery = this.propertyRepository.createQueryBuilder('property')
      .leftJoin('property.rooms', 'room')
      .leftJoin('room.rentals', 'rental', 'rental.isActive = :isActive', { isActive: true })
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      propertyOccupancyQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const propertiesWithRooms = await propertyOccupancyQuery
      .select('property.id', 'id')
      .addSelect('property.name', 'name')
      .addSelect('COUNT(DISTINCT room.id)', 'totalRooms')
      .addSelect('COUNT(DISTINCT rental.id)', 'occupiedRooms')
      .groupBy('property.id')
      .addGroupBy('property.name')
      .getRawMany();
    
    const propertyOccupancy = propertiesWithRooms.map(property => ({
      id: property.id,
      name: property.name,
      totalRooms: Number(property.totalRooms),
      occupiedRooms: Number(property.occupiedRooms),
      vacantRooms: Number(property.totalRooms) - Number(property.occupiedRooms),
      occupancyRate: Number(property.totalRooms) > 0 ? 
        (Number(property.occupiedRooms) / Number(property.totalRooms)) * 100 : 0,
    }));
    
    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      propertyOccupancy,
    };
  }

  /**
   * Get payment statistics
   */
  private async getPaymentStatistics(
    landlordId: number, 
    startDate: Date, 
    endDate: Date, 
    propertyId?: number
  ) {
    // Get total payments
    const paymentsQuery = this.paymentRepository.createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    
    if (propertyId) {
      paymentsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const totalPaymentsResult = await paymentsQuery
      .select('COUNT(payment.id)', 'count')
      .addSelect('SUM(payment.amount)', 'sum')
      .addSelect('AVG(payment.amount)', 'avg')
      .getRawOne();
    
    // Get late payments
    const latePaymentsQuery = this.paymentRepository.createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('payment.isLatePayment = :isLate', { isLate: true });
    
    if (propertyId) {
      latePaymentsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const latePaymentsResult = await latePaymentsQuery
      .select('COUNT(payment.id)', 'count')
      .addSelect('SUM(payment.amount)', 'sum')
      .addSelect('SUM(payment.lateFee)', 'lateFees')
      .getRawOne();
    
    // Get payment methods breakdown
    const paymentMethodsQuery = this.paymentRepository.createQueryBuilder('payment')
      .innerJoin('payment.rental', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    
    if (propertyId) {
      paymentMethodsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const paymentMethodsResult = await paymentMethodsQuery
      .select('payment.paymentMethod', 'method')
      .addSelect('COUNT(payment.id)', 'count')
      .addSelect('SUM(payment.amount)', 'sum')
      .groupBy('payment.paymentMethod')
      .getRawMany();
    
    const paymentMethods = paymentMethodsResult.map(method => ({
      method: method.method || 'Not Specified',
      count: Number(method.count),
      amount: Number(method.sum),
      percentage: Number(totalPaymentsResult.count) > 0 ? 
        (Number(method.count) / Number(totalPaymentsResult.count)) * 100 : 0,
    }));
    
    return {
      totalPayments: {
        count: Number(totalPaymentsResult?.count || 0),
        amount: Number(totalPaymentsResult?.sum || 0),
        averageAmount: Number(totalPaymentsResult?.avg || 0),
      },
      latePayments: {
        count: Number(latePaymentsResult?.count || 0),
        amount: Number(latePaymentsResult?.sum || 0),
        lateFees: Number(latePaymentsResult?.lateFees || 0),
        percentage: Number(totalPaymentsResult?.count) > 0 ? 
          (Number(latePaymentsResult?.count || 0) / Number(totalPaymentsResult.count)) * 100 : 0,
      },
      paymentMethods,
    };
  }

  /**
   * Get tenant statistics
   */
  private async getTenantStatistics(landlordId: number) {
    // Get total tenants
    const tenantsQuery = this.userRepository.createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });
    
    const totalTenants = await tenantsQuery
      .distinctOn(['user.id'])
      .getCount();
    
    // Get tenants with overdue payments
    const overdueTenantsQuery = this.userRepository.createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.paymentStatus = :status', { status: PaymentStatus.OVERDUE });
    
    const overdueTenants = await overdueTenantsQuery
      .distinctOn(['user.id'])
      .getCount();
    
    // Get tenant retention rate (tenants with rentals > 1 year)
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    const longTermTenantsQuery = this.userRepository.createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.startDate <= :oneYearAgo', { oneYearAgo });
    
    const longTermTenants = await longTermTenantsQuery
      .distinctOn(['user.id'])
      .getCount();
    
    return {
      totalTenants,
      overdueTenants,
      longTermTenants,
      tenantRetentionRate: totalTenants > 0 ? (longTermTenants / totalTenants) * 100 : 0,
      overdueTenantRate: totalTenants > 0 ? (overdueTenants / totalTenants) * 100 : 0,
    };
  }

  /**
   * Get rental performance metrics
   */
  async getRentalPerformanceMetrics(landlordId: number, queryDto: AnalyticsQueryDto) {
    const { startDate, endDate, propertyId } = queryDto;
    
    // Set default date range if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); // 6 months ago
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Get all properties for this landlord
    const propertiesQuery = this.propertyRepository.createQueryBuilder('property')
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      propertiesQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const properties = await propertiesQuery.getMany();
    
    // Get performance metrics for each property
    const propertyMetrics = await Promise.all(properties.map(async (property) => {
      // Calculate expected income for this property
      const roomsQuery = this.roomRepository.createQueryBuilder('room')
        .where('room.propertyId = :propertyId', { propertyId: property.id });
        
      const rooms = await roomsQuery.getMany();
      
      // Calculate total expected monthly income
      const totalExpectedMonthly = rooms.reduce((sum, room) => sum + room.rentAmount, 0);
      
      // Calculate total area
      const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);
      
      // Calculate actual income for the period
      const paymentsQuery = this.paymentRepository.createQueryBuilder('payment')
        .innerJoin('payment.rental', 'rental')
        .innerJoin('rental.room', 'room')
        .where('room.propertyId = :propertyId', { propertyId: property.id })
        .andWhere('payment.paymentDate BETWEEN :start AND :end', { start, end });
      
      const paymentsResult = await paymentsQuery
        .select('SUM(payment.amount)', 'total')
        .getRawOne();
      
      const actualIncome = Number(paymentsResult?.total || 0);
      
      // Calculate occupancy rate
      const occupiedRoomsQuery = this.roomRepository.createQueryBuilder('room')
        .innerJoin('room.rentals', 'rental')
        .where('room.propertyId = :propertyId', { propertyId: property.id })
        .andWhere('rental.isActive = :isActive', { isActive: true });
      
      const occupiedRooms = await occupiedRoomsQuery.getCount();
      const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;
      
      // Calculate income per square foot/meter
      const incomePerArea = totalArea > 0 ? totalExpectedMonthly / totalArea : 0;
      
      // Calculate late payment rate
      const latePaymentsQuery = this.paymentRepository.createQueryBuilder('payment')
        .innerJoin('payment.rental', 'rental')
        .innerJoin('rental.room', 'room')
        .where('room.propertyId = :propertyId', { propertyId: property.id })
        .andWhere('payment.paymentDate BETWEEN :start AND :end', { start, end })
        .andWhere('payment.isLatePayment = :isLate', { isLate: true });
      
      const totalPaymentsQuery = this.paymentRepository.createQueryBuilder('payment')
        .innerJoin('payment.rental', 'rental')
        .innerJoin('rental.room', 'room')
        .where('room.propertyId = :propertyId', { propertyId: property.id })
        .andWhere('payment.paymentDate BETWEEN :start AND :end', { start, end });
      
      const latePayments = await latePaymentsQuery.getCount();
      const totalPayments = await totalPaymentsQuery.getCount();
      
      const latePaymentRate = totalPayments > 0 ? (latePayments / totalPayments) * 100 : 0;
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        totalRooms: rooms.length,
        occupiedRooms,
        occupancyRate,
        monthlyExpectedIncome: totalExpectedMonthly,
        periodActualIncome: actualIncome,
        incomePerArea,
        latePaymentRate,
        // Calculate ROI (simplified)
        estimatedAnnualIncome: totalExpectedMonthly * 12,
        performanceRating: calculatePerformanceRating(occupancyRate, latePaymentRate),
      };
    }));
    
    // Sort properties by performance rating
    propertyMetrics.sort((a, b) => b.performanceRating - a.performanceRating);
    
    return {
      dateRange: {
        startDate: start,
        endDate: end,
      },
      propertyMetrics,
    };
  }

  /**
   * Get tenant payment behavior analytics
   */
  async getTenantPaymentAnalytics(landlordId: number, queryDto: AnalyticsQueryDto) {
    const { startDate, endDate, propertyId } = queryDto;
    
    // Set default date range if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); // 3 months ago
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Get all active tenants for this landlord
    const tenantsQuery = this.userRepository.createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('rental.isActive = :isActive', { isActive: true });
    
    if (propertyId) {
      tenantsQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const tenants = await tenantsQuery
      .distinctOn(['user.id'])
      .getMany();
    
    // Get payment analytics for each tenant
    const tenantAnalytics = await Promise.all(tenants.map(async (tenant) => {
      // Get tenant's rentals
      const rentalsQuery = this.rentalRepository.createQueryBuilder('rental')
        .innerJoin('rental.room', 'room')
        .innerJoin('room.property', 'property')
        .where('rental.tenantId = :tenantId', { tenantId: tenant.id })
        .andWhere('property.ownerId = :landlordId', { landlordId });
      
      if (propertyId) {
        rentalsQuery.andWhere('property.id = :propertyId', { propertyId });
      }
      
      const rentals = await rentalsQuery.getMany();
      
      if (rentals.length === 0) {
        return null;
      }
      
      const rentalIds = rentals.map(rental => rental.id);
      
      // Get payments for this tenant in the period
      const paymentsQuery = this.paymentRepository.createQueryBuilder('payment')
        .where('payment.rentalId IN (:...rentalIds)', { rentalIds })
        .andWhere('payment.paymentDate BETWEEN :start AND :end', { start, end });
      
      const payments = await paymentsQuery.getMany();
      
      // Calculate on-time payment rate
      const totalPayments = payments.length;
      const latePayments = payments.filter(payment => payment.isLatePayment).length;
      const onTimePaymentRate = totalPayments > 0 ? 
        ((totalPayments - latePayments) / totalPayments) * 100 : 0;
      
      // Calculate average days to pay
      let totalDaysToPay = 0;
      let paymentsWithDates = 0;
      
      for (const rental of rentals) {
        for (const payment of payments) {
          if (payment.rentalId === rental.id) {
            // Calculate days from due date to payment date
            const dueDate = new Date(payment.paymentDate);
            dueDate.setDate(rental.rentDueDay);
            
            // If payment date is before due date, days to pay is 0
            if (payment.paymentDate <= dueDate) {
              totalDaysToPay += 0;
            } else {
              const daysDiff = Math.floor(
                (payment.paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              totalDaysToPay += daysDiff;
            }
            
            paymentsWithDates++;
          }
        }
      }
      
      const averageDaysToPay = paymentsWithDates > 0 ? totalDaysToPay / paymentsWithDates : 0;
      
      // Calculate current outstanding amount
      const outstandingAmount = rentals.reduce((sum, rental) => sum + rental.outstandingAmount, 0);
      
      // Calculate payment consistency score (0-100)
      const paymentConsistencyScore = calculatePaymentConsistencyScore(
        onTimePaymentRate,
        averageDaysToPay,
        outstandingAmount > 0
      );
      
      return {
        tenantId: tenant.id,
        tenantName: tenant.fullName,
        totalPayments,
        latePayments,
        onTimePaymentRate,
        averageDaysToPay,
        outstandingAmount,
        paymentConsistencyScore,
        paymentRating: getPaymentRating(paymentConsistencyScore),
      };
    }));
    
    // Filter out null results and sort by payment consistency score
    const filteredAnalytics = tenantAnalytics
      .filter(analytics => analytics !== null)
      .sort((a, b) => b.paymentConsistencyScore - a.paymentConsistencyScore);
    
    return {
      dateRange: {
        startDate: start,
        endDate: end,
      },
      tenantAnalytics: filteredAnalytics,
    };
  }

  /**
   * Get forecasting and projections
   */
  async getFinancialProjections(landlordId: number, queryDto: AnalyticsQueryDto) {
    const { propertyId } = queryDto;
    
    // Get current occupancy and income data
    const occupancyStats = await this.getOccupancyStatistics(landlordId, propertyId);
    
    // Get all properties
    const propertiesQuery = this.propertyRepository.createQueryBuilder('property')
      .where('property.ownerId = :landlordId', { landlordId });
    
    if (propertyId) {
      propertiesQuery.andWhere('property.id = :propertyId', { propertyId });
    }
    
    const properties = await propertiesQuery.getMany();
    
    // Calculate projections for each property
    const propertyProjections = await Promise.all(properties.map(async (property) => {
      // Get rooms for this property
      const roomsQuery = this.roomRepository.createQueryBuilder('room')
        .where('room.propertyId = :propertyId', { propertyId: property.id });
      
      const rooms = await roomsQuery.getMany();
      
      // Calculate total current monthly income
      const totalCurrentMonthly = rooms.reduce((sum, room) => {
        // If room has active rental, it's generating income
        const isOccupied = room.rentals && room.rentals.some(rental => rental.isActive);
        return sum + (isOccupied ? room.rentAmount : 0);
      }, 0);
      
      // Calculate total potential monthly income (all rooms occupied)
      const totalPotentialMonthly = rooms.reduce((sum, room) => sum + room.rentAmount, 0);
      
      // Calculate current occupancy rate for this property
      const roomsWithRentals = rooms.filter(
        room => room.rentals && room.rentals.some(rental => rental.isActive)
      ).length;
      
      const currentOccupancyRate = rooms.length > 0 ? (roomsWithRentals / rooms.length) * 100 : 0;
      
      // Project monthly income for the next 12 months
      const monthlyProjections = [];
      let projectedOccupancyRate = currentOccupancyRate;
      
      // Assume 1-2% occupancy increase per month until 95% is reached
      for (let i = 0; i < 12; i++) {
        // Increase occupancy rate each month, cap at 95%
        if (projectedOccupancyRate < 95) {
          // Random increase between 1-2%
          const increase = 1 + Math.random();
          projectedOccupancyRate = Math.min(95, projectedOccupancyRate + increase);
        }
        
        // Calculate projected income based on occupancy
        const projectedIncome = (totalPotentialMonthly * projectedOccupancyRate) / 100;
        
        // Add projection for this month
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        
        monthlyProjections.push({
          month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
          occupancyRate: projectedOccupancyRate,
          projectedIncome,
        });
      }
      
      // Calculate annual projections
      const annualProjectedIncome = monthlyProjections.reduce(
        (sum, month) => sum + month.projectedIncome, 0
      );
      
      // Simple estimate of annual expenses (30% of potential income)
      const annualExpenses = annualProjectedIncome * 0.3;
      
      // Calculate net operating income
      const netOperatingIncome = annualProjectedIncome - annualExpenses;
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        currentMonthlyIncome: totalCurrentMonthly,
        potentialMonthlyIncome: totalPotentialMonthly,
        currentOccupancyRate,
        monthlyProjections,
        annualProjections: {
          grossIncome: annualProjectedIncome,
          expenses: annualExpenses,
          netOperatingIncome,
          capRate: property.totalArea > 0 ? 
            (netOperatingIncome / (totalPotentialMonthly * 12)) * 100 : 0,
        },
      };
    }));
    
    return {
      propertyProjections,
    };
  }
}

/**
 * Helper function to calculate performance rating (0-100)
 */
function calculatePerformanceRating(occupancyRate: number, latePaymentRate: number): number {
  // Weight occupancy as 70% of score, inverse of late payment rate as 30%
  const occupancyScore = Math.min(100, occupancyRate) * 0.7;
  const paymentScore = (100 - Math.min(100, latePaymentRate)) * 0.3;
  
  return Math.round(occupancyScore + paymentScore);
}

/**
 * Helper function to calculate payment consistency score (0-100)
 */
function calculatePaymentConsistencyScore(
  onTimeRate: number,
  avgDaysToPay: number,
  hasOutstanding: boolean
): number {
  // On-time rate contributes 60% of score
  const onTimeScore = onTimeRate * 0.6;
  
  // Days to pay contributes 30% of score (0 days = 30 points, 30+ days = 0 points)
  const daysScore = Math.max(0, 30 - Math.min(30, avgDaysToPay)) * 1;
  
  // Outstanding balance reduces score by 10% if present
  const outstandingPenalty = hasOutstanding ? 0 : 10;
  
  return Math.round(onTimeScore + daysScore + outstandingPenalty);
}

/**
 * Helper function to get payment rating description
 */
function getPaymentRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}
