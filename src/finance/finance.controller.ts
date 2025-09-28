import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateFinanceDto } from './dto/create-finance.dto';
import { UpdateFinanceDto } from './dto/update-finance.dto';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Add a financial record (e.g., expense, payment collection)
  @Post('add')
  async create(@Body() createFinanceDto: CreateFinanceDto) {
    return await this.financeService.create(createFinanceDto);
  }

  // Fetch all financial records
  @Get('list')
  async findAll() {
    return await this.financeService.findAll();
  }

  // Fetch financial details for a specific property
  @Get('property/:property_id')
  async findByProperty(@Param('property_id') property_id: string) {
    return await this.financeService.findByProperty(property_id);
  }

  // Fetch a specific finance record by its ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.financeService.findOne(id);
  }

  // Update a finance record
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFinanceDto: UpdateFinanceDto,
  ) {
    return await this.financeService.update(id, updateFinanceDto);
  }

  // Delete a finance record
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.financeService.remove(id);
  }
}
