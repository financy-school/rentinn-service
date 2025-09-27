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
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  createProperty(
    @Request() req: any,
    @Body() createPropertyDto: CreatePropertyDto,
  ) {
    return this.propertiesService.createProperty(
      req.user.id,
      createPropertyDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllProperties(
    @Query() paginationDto: PaginationDto,
    @Request() req: any,
  ) {
    return this.propertiesService.findAllProperties(
      paginationDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':property_id')
  @UseGuards(JwtAuthGuard)
  findPropertyById(@Param('property_id') property_id: string) {
    return this.propertiesService.findPropertyById(property_id);
  }

  @Patch(':property_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async updateProperty(
    @Param('property_id') property_id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateProperty(
      property_id,
      updatePropertyDto,
    );
  }

  @Delete(':property_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async removeProperty(@Param('property_id') property_id: string) {
    return this.propertiesService.removeProperty(property_id);
  }

  @Post(':property_id/rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async createRoom(
    @Param('property_id') property_id: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.propertiesService.createRoom(property_id, createRoomDto);
  }

  @Get(':property_id/rooms')
  @UseGuards(JwtAuthGuard)
  findPropertyRooms(
    @Param('property_id') property_id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.propertiesService.findPropertyRooms(property_id, paginationDto);
  }

  @Get(':property_id/rooms/:room_id')
  @UseGuards(JwtAuthGuard)
  findRoomById(
    @Param('property_id') property_id: string,
    @Param('room_id') room_id: string,
  ) {
    return this.propertiesService.findRoomById(property_id, room_id);
  }

  @Patch('/:property_id/rooms/:room_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async updateRoom(
    @Param('property_id') property_id: string,
    @Param('room_id') room_id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.propertiesService.updateRoom(
      property_id,
      room_id,
      updateRoomDto,
    );
  }

  @Delete(':property_id/rooms/:room_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async removeRoom(
    @Param('property_id') property_id: string,
    @Param('room_id') room_id: string,
  ) {
    return this.propertiesService.removeRoom(property_id, room_id);
  }

  @Get('rooms/available/list')
  @UseGuards(JwtAuthGuard)
  findAvailableRooms(@Query() paginationDto: PaginationDto) {
    return this.propertiesService.findAvailableRooms(paginationDto);
  }
}
