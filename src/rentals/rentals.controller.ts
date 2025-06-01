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
  ParseIntPipe,
  Request,
  ForbiddenException,
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const rental = await this.rentalsService.findOne(id);

    // Check if user has permission to view this rental
    if (req.user.role === UserRole.TENANT && rental.tenantId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to view this rental',
      );
    }

    if (req.user.role === UserRole.LANDLORD) {
      const isLandlord = await this.rentalsService.isRentalLandlord(
        id,
        req.user.id,
      );
      if (!isLandlord) {
        throw new ForbiddenException(
          'You do not have permission to view this rental',
        );
      }
    }

    return rental;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRentalDto: UpdateRentalDto,
    @Request() req: any,
  ) {
    // Check if user is the landlord for this rental
    if (req.user.role === UserRole.LANDLORD) {
      const isLandlord = await this.rentalsService.isRentalLandlord(
        id,
        req.user.id,
      );
      if (!isLandlord) {
        throw new ForbiddenException(
          'You do not have permission to update this rental',
        );
      }
    }

    return this.rentalsService.update(id, updateRentalDto);
  }

  @Post(':id/payments')
  @UseGuards(JwtAuthGuard)
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() recordPaymentDto: RecordPaymentDto,
    @Request() req: any,
  ) {
    // Check permissions - admin, landlord of the property, or tenant making payment
    if (req.user.role === UserRole.TENANT) {
      const isTenant = await this.rentalsService.isRentalTenant(
        id,
        req.user.id,
      );
      if (!isTenant) {
        throw new ForbiddenException(
          'You do not have permission to record payments for this rental',
        );
      }
    } else if (req.user.role === UserRole.LANDLORD) {
      const isLandlord = await this.rentalsService.isRentalLandlord(
        id,
        req.user.id,
      );
      if (!isLandlord) {
        throw new ForbiddenException(
          'You do not have permission to record payments for this rental',
        );
      }
    }

    return this.rentalsService.recordPayment(id, recordPaymentDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rentalsService.remove(id);
  }
}
