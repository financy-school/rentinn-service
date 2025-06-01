import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getDashboardOverview(
    @Query() queryDto: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    // For admin, they need to specify a landlord ID
    if (req.user.role === UserRole.ADMIN && !req.query.landlordId) {
      throw new ForbiddenException(
        'Admin must specify a landlordId query parameter',
      );
    }

    const landlordId =
      req.user.role === UserRole.ADMIN
        ? parseInt(req.query.landlordId, 10)
        : req.user.id;

    return this.analyticsService.getDashboardOverview(landlordId, queryDto);
  }

  @Get('performance')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getRentalPerformanceMetrics(
    @Query() queryDto: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    // For admin, they need to specify a landlord ID
    if (req.user.role === UserRole.ADMIN && !req.query.landlordId) {
      throw new ForbiddenException(
        'Admin must specify a landlordId query parameter',
      );
    }

    const landlordId =
      req.user.role === UserRole.ADMIN
        ? parseInt(req.query.landlordId, 10)
        : req.user.id;

    return this.analyticsService.getRentalPerformanceMetrics(
      landlordId,
      queryDto,
    );
  }

  @Get('tenants')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getTenantPaymentAnalytics(
    @Query() queryDto: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    // For admin, they need to specify a landlord ID
    if (req.user.role === UserRole.ADMIN && !req.query.landlordId) {
      throw new ForbiddenException(
        'Admin must specify a landlordId query parameter',
      );
    }

    const landlordId =
      req.user.role === UserRole.ADMIN
        ? parseInt(req.query.landlordId, 10)
        : req.user.id;

    return this.analyticsService.getTenantPaymentAnalytics(
      landlordId,
      queryDto,
    );
  }

  @Get('projections')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getFinancialProjections(
    @Query() queryDto: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    // For admin, they need to specify a landlord ID
    if (req.user.role === UserRole.ADMIN && !req.query.landlordId) {
      throw new ForbiddenException(
        'Admin must specify a landlordId query parameter',
      );
    }

    const landlordId =
      req.user.role === UserRole.ADMIN
        ? parseInt(req.query.landlordId, 10)
        : req.user.id;

    return this.analyticsService.getFinancialProjections(landlordId, queryDto);
  }

  @Get('property/:id')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async getPropertyAnalytics(
    @Param('id', ParseIntPipe) propertyId: number,
    @Query() queryDto: AnalyticsQueryDto,
    @Request() req: any,
  ) {
    // Create a new query DTO with the property ID
    const propertyQueryDto = {
      ...queryDto,
      propertyId,
    };

    // For admin, they need to specify a landlord ID
    if (req.user.role === UserRole.ADMIN && !req.query.landlordId) {
      throw new ForbiddenException(
        'Admin must specify a landlordId query parameter',
      );
    }

    const landlordId =
      req.user.role === UserRole.ADMIN
        ? parseInt(req.query.landlordId, 10)
        : req.user.id;

    // Get all analytics for this property
    const [dashboardData, performanceData, tenantData, projectionsData] =
      await Promise.all([
        this.analyticsService.getDashboardOverview(
          landlordId,
          propertyQueryDto,
        ),
        this.analyticsService.getRentalPerformanceMetrics(
          landlordId,
          propertyQueryDto,
        ),
        this.analyticsService.getTenantPaymentAnalytics(
          landlordId,
          propertyQueryDto,
        ),
        this.analyticsService.getFinancialProjections(
          landlordId,
          propertyQueryDto,
        ),
      ]);

    return {
      propertyId,
      dashboard: dashboardData,
      performance: performanceData,
      tenants: tenantData,
      projections: projectionsData,
    };
  }
}
