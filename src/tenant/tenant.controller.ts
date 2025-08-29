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
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
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

  @Get('property/:propertyId')
  @UseGuards(JwtAuthGuard)
  findByProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tenantsService.findByProperty(propertyId, paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/notice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  putOnNotice(@Param('id') id: string) {
    return this.tenantsService.putOnNotice(id);
  }

  @Patch(':id/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  checkOut(
    @Param('id') id: string,
    @Query('checkOutDate') checkOutDate?: string,
  ) {
    return this.tenantsService.checkOut(id, checkOutDate);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
