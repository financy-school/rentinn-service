import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  DashboardAnalyticsQueryDto,
  OccupancyAnalyticsQueryDto,
  RevenueTrendsQueryDto,
  ProfitLossAnalyticsQueryDto,
} from './dto/analytics-query.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getDashboardAnalytics(
    @Query() query: DashboardAnalyticsQueryDto,
    @Req() req: any,
  ) {
    return await this.analyticsService.getDashboardAnalytics(query, req.user);
  }

  @Get('occupancy')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getOccupancyAnalytics(
    @Query() query: OccupancyAnalyticsQueryDto,
    @Req() req: any,
  ) {
    return await this.analyticsService.getOccupancyAnalytics(query, req.user);
  }

  @Get('revenue-trends')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getRevenueTrends(
    @Query() query: RevenueTrendsQueryDto,
    @Req() req: any,
  ) {
    return await this.analyticsService.getRevenueTrends(query, req.user);
  }

  @Get('profit-loss')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getProfitLossAnalytics(
    @Query() query: ProfitLossAnalyticsQueryDto,
    @Req() req: any,
  ) {
    return await this.analyticsService.getProfitLossAnalytics(query, req.user);
  }
}
