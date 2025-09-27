import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tenantsService.findAll(paginationDto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  findActive(@Query() paginationDto: PaginationDto) {
    return this.tenantsService.findActive(paginationDto);
  }

  @Get('room/:roomId')
  @UseGuards(JwtAuthGuard)
  findByRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tenantsService.findByRoom(roomId, paginationDto);
  }

  @Get('property/:propertyId/room/:roomId')
  @UseGuards(JwtAuthGuard)
  findByPropertyAndRoom(
    @Param('propertyId') propertyId: string,
    @Param('roomId') roomId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tenantsService.findByPropertyAndRoom(
      propertyId,
      roomId,
      paginationDto,
    );
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  searchTenants(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tenantsService.searchTenants(query, paginationDto);
  }

  @Get('property/:property_id')
  @UseGuards(JwtAuthGuard)
  findByProperty(
    @Param('property_id') property_id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tenantsService.findByProperty(property_id, paginationDto);
  }

  @Get(':tenant_id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('tenant_id') tenant_id: string) {
    return this.tenantsService.findOne(tenant_id);
  }

  @Patch(':tenant_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  update(
    @Param('tenant_id') tenant_id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(tenant_id, updateTenantDto);
  }

  @Patch(':tenant_id/notice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  putOnNotice(@Param('tenant_id') tenant_id: string) {
    return this.tenantsService.putOnNotice(tenant_id);
  }

  @Patch(':tenant_id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  checkOut(
    @Param('tenant_id') tenant_id: string,
    @Query('checkOutDate') checkOutDate?: string,
  ) {
    return this.tenantsService.checkOut(tenant_id, checkOutDate);
  }

  @Delete(':tenant_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  remove(@Param('tenant_id') tenant_id: string) {
    return this.tenantsService.remove(tenant_id);
  }
}
