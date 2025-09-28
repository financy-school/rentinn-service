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

import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { TenantService } from './tenant.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  create(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.create(createTenantDto, user_id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.findAll(paginationDto, user_id);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findActive(
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.findActive(paginationDto, user_id);
  }

  @Get('room/:room_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findByRoom(
    @Param('room_id') room_id: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.findByRoom(room_id, paginationDto, user_id);
  }

  @Get('property/:property_id/room/:room_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findByPropertyAndRoom(
    @Param('property_id') property_id: string,
    @Param('room_id') room_id: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.findByPropertyAndRoom(
      property_id,
      room_id,
      paginationDto,
      user_id,
    );
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  searchTenants(
    @Query('q') query: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.searchTenants(query, paginationDto, user_id);
  }

  @Get('property/:property_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findByProperty(
    @Param('property_id') property_id: string,
    @Query() paginationDto: PaginationDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.findByProperty(
      property_id,
      paginationDto,
      user_id,
    );
  }

  @Get(':tenant_id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  findOne(
    @Param('tenant_id') tenant_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.findOne(tenant_id, user_id);
  }

  @Patch(':tenant_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  update(
    @Param('tenant_id') tenant_id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.update(tenant_id, updateTenantDto, user_id);
  }

  @Patch(':tenant_id/notice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  putOnNotice(
    @Param('tenant_id') tenant_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.putOnNotice(tenant_id, user_id);
  }

  @Patch(':tenant_id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  checkOut(
    @CurrentUser('user_id') user_id: string,
    @Param('tenant_id') tenant_id: string,
    @Query('checkOutDate') checkOutDate?: string,
  ) {
    return this.tenantsService.checkOut(user_id, tenant_id, checkOutDate);
  }

  @Delete(':tenant_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  remove(
    @Param('tenant_id') tenant_id: string,
    @CurrentUser('user_id') user_id: string,
  ) {
    return this.tenantsService.remove(tenant_id, user_id);
  }
}
