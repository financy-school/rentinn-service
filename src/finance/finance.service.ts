import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';
import { Finance } from './entities/finance.entity';
import {
  RevenueOverviewQueryDto,
  RevenueOverviewResponseDto,
} from './dto/revenue-overview.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Finance)
    private readonly financeRepository: Repository<Finance>,
  ) {}

  async create(createFinanceDto: CreateFinanceDto): Promise<Finance> {
    const finance = this.financeRepository.create(createFinanceDto);
    return await this.financeRepository.save(finance);
  }

  async findAll(): Promise<Finance[]> {
    return await this.financeRepository.find();
  }

  async findByProperty(property_id: string): Promise<Finance[]> {
    return await this.financeRepository.find({
      where: { property_id },
    });
  }

  async findOne(id: string): Promise<Finance> {
    const finance = await this.financeRepository.findOne({ where: { id } });
    if (!finance) {
      throw new NotFoundException(`Finance record with ID ${id} not found`);
    }
    return finance;
  }

  async update(
    id: string,
    updateFinanceDto: UpdateFinanceDto,
  ): Promise<Finance> {
    const finance = await this.findOne(id);
    const updatedFinance = Object.assign(finance, updateFinanceDto);
    return await this.financeRepository.save(updatedFinance);
  }

  async remove(id: string): Promise<void> {
    const finance = await this.findOne(id);
    await this.financeRepository.remove(finance);
  }

  async getRevenueOverview(
    query: RevenueOverviewQueryDto,
  ): Promise<RevenueOverviewResponseDto> {
    const { propertyId } = query;

    const whereCondition: any = {};
    if (propertyId && propertyId !== 'all') {
      whereCondition.property_id = propertyId;
    }

    const allRecords = await this.financeRepository.find({
      where: whereCondition,
      relations: ['tenant'],
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Calculate total revenue
    const totalRevenue = Math.round(
      allRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    );

    // Calculate monthly revenue
    const monthlyRecords = allRecords.filter(
      (r) => new Date(r.created_at) >= monthStart,
    );
    const monthlyRevenue = Math.round(
      monthlyRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    );

    // Calculate yearly revenue
    const yearlyRecords = allRecords.filter(
      (r) => new Date(r.created_at) >= yearStart,
    );
    const yearlyRevenue = Math.round(
      yearlyRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    );

    // Calculate pending and overdue payments
    let pendingPayments = 0;
    let overduePayments = 0;
    allRecords.forEach((record) => {
      if (!record.is_paid) {
        const amount = Number(record.amount || 0);
        if (record.due_date && new Date(record.due_date) < now) {
          overduePayments += amount;
        } else {
          pendingPayments += amount;
        }
      }
    });

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRecords = allRecords.filter((r) => {
        const date = new Date(r.created_at);
        return date >= monthDate && date <= monthEnd;
      });

      const amount = monthRecords.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0,
      );
      const received = monthRecords
        .filter((r) => r.is_paid)
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.round(amount),
        received: Math.round(received),
        pending: Math.round(amount - received),
      });
    }

    // Calculate category breakdown
    const categories = ['rent', 'electricity', 'maintenance'];
    const categoryBreakdown = categories
      .map((cat) => {
        const catRecords = allRecords.filter(
          (r) => r.transaction_type?.toLowerCase() === cat,
        );
        const amount = catRecords.reduce(
          (sum, r) => sum + Number(r.amount || 0),
          0,
        );
        return {
          category: cat.charAt(0).toUpperCase() + cat.slice(1),
          amount: Math.round(amount),
          percentage:
            totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
          count: catRecords.length,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Get top tenants
    const tenantMap = new Map();
    allRecords.forEach((record) => {
      if (!record.tenant) return;
      const tenantId = record.tenant.tenant_id;
      if (!tenantMap.has(tenantId)) {
        tenantMap.set(tenantId, {
          tenantId,
          name: record.tenant?.name || 'Unknown',
          property: record.property_id || 'N/A',
          amount: 0,
          payments: 0,
        });
      }
      const tenant = tenantMap.get(tenantId);
      tenant.amount += Number(record.amount || 0);
      tenant.payments += 1;
    });

    const topTenants = Array.from(tenantMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({
        ...t,
        amount: Math.round(t.amount),
      }));

    // Calculate growth percentage
    const growthPercentage =
      monthlyTrend.length >= 2
        ? Number(
            (
              ((monthlyTrend[5].amount - monthlyTrend[4].amount) /
                monthlyTrend[4].amount) *
              100
            ).toFixed(1),
          )
        : 0;

    // Calculate collected amount
    const collectedAmount = Math.round(
      monthlyRecords
        .filter((r) => r.is_paid)
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    );

    // Calculate average monthly
    const monthlyTotals = new Map();
    allRecords.forEach((record) => {
      const date = new Date(record.created_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const current = monthlyTotals.get(monthKey) || 0;
      monthlyTotals.set(monthKey, current + Number(record.amount || 0));
    });
    const averageMonthly =
      monthlyTotals.size > 0
        ? Math.round(
            Array.from(monthlyTotals.values()).reduce((a, b) => a + b, 0) /
              monthlyTotals.size,
          )
        : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      pendingPayments: Math.round(pendingPayments),
      overduePayments: Math.round(overduePayments),
      averageMonthly,
      totalProperties: propertyId ? 1 : 3,
      occupiedUnits: 24,
      monthlyTrend,
      categoryBreakdown,
      topTenants,
      growthPercentage,
      collectedAmount,
    };
  }
}
