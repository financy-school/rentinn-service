import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  create(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(createRentalDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.rentalsService.findAll(paginationDto);
  }

  @Get('landlord')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD)
  findLandlordRentals(
    @Query() paginationDto: PaginationDto,
    @Request() req: any,
  ) {
    return this.rentalsService.findLandlordRentals(req.user.id, paginationDto);
  }

  @Get('tenant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT)
  findTenantRentals(
    @Query() paginationDto: PaginationDto,
    @Request() req: any,
  ) {
    return this.rentalsService.findTenantRentals(req.user.id, paginationDto);
  }

  @Get('overdue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findOverdueRentals(@Query() paginationDto: PaginationDto) {
    return this.rentalsService.findOverdueRentals(paginationDto);
  }

  @Get(':rental_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.TENANT, UserRole.ADMIN)
  async findOne(@Param('rental_id') rental_id: string) {
    return await this.rentalsService.findOne(rental_id);
  }

  @Patch(':rental_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async update(
    @Param('rental_id') rental_id: string,
    @Body() updateRentalDto: UpdateRentalDto,
  ) {
    return this.rentalsService.update(rental_id, updateRentalDto);
  }

  @Post(':rental_id/payments')
  @UseGuards(JwtAuthGuard)
  async recordPayment(
    @Param('rental_id') rental_id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    return this.rentalsService.recordPayment(rental_id, recordPaymentDto);
  }

  @Delete(':property_id/property/:room_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(
    @Param('property_id') property_id: string,
    @Param('room_id') room_id: string,
  ) {
    return this.rentalsService.remove(property_id, room_id);
  }
}
