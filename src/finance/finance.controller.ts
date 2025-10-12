import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';
import { RevenueOverviewQueryDto } from './dto/revenue-overview.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post()
  async create(@Body() createFinanceDto: CreateFinanceDto) {
    return await this.financeService.create(createFinanceDto);
  }

  @Get('list')
  async findAll() {
    return await this.financeService.findAll();
  }

  @Get('property/:property_id')
  async findByProperty(@Param('property_id') property_id: string) {
    return await this.financeService.findByProperty(property_id);
  }

  /**
   * Get Revenue Overview
   * Query Parameters:
   * @param propertyId - Filter by specific property (optional)
   * @param period - 'month' | 'year' | 'all' | 'custom' (default: 'month')
   * @param startDate - Start date for custom period (ISO format)
   * @param endDate - End date for custom period (ISO format)
   *
   * Example:
   * GET /finance/revenue-overview?propertyId=prop-123&period=month
   */
  @Get('revenue-overview')
  @UseGuards(JwtAuthGuard)
  async getRevenueOverview(@Query() query: RevenueOverviewQueryDto) {
    return await this.financeService.getRevenueOverview(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.financeService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFinanceDto: UpdateFinanceDto,
  ) {
    return await this.financeService.update(id, updateFinanceDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.financeService.remove(id);
  }
}
