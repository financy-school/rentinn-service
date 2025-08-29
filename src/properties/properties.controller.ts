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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findPropertyById(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findPropertyById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async updateProperty(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req: any,
  ) {
    // Check if user is the owner or admin
    if (req.user.role !== UserRole.ADMIN) {
      const isOwner = await this.propertiesService.isPropertyOwner(
        id,
        req.user.id,
      );
      if (!isOwner) {
        throw new ForbiddenException(
          'You do not have permission to update this property',
        );
      }
    }

    return this.propertiesService.updateProperty(id, updatePropertyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async removeProperty(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    // Check if user is the owner or admin
    if (req.user.role !== UserRole.ADMIN) {
      const isOwner = await this.propertiesService.isPropertyOwner(
        id,
        req.user.id,
      );
      if (!isOwner) {
        throw new ForbiddenException(
          'You do not have permission to delete this property',
        );
      }
    }

    return this.propertiesService.removeProperty(id);
  }

  @Post(':id/rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async createRoom(
    @Param('id', ParseIntPipe) propertyId: number,
    @Body() createRoomDto: CreateRoomDto,
    @Request() req: any,
  ) {
    // Check if user is the owner or admin
    if (req.user.role !== UserRole.ADMIN) {
      const isOwner = await this.propertiesService.isPropertyOwner(
        propertyId,
        req.user.id,
      );
      if (!isOwner) {
        throw new ForbiddenException(
          'You do not have permission to add rooms to this property',
        );
      }
    }

    return this.propertiesService.createRoom(propertyId, createRoomDto);
  }

  @Get(':id/rooms')
  @UseGuards(JwtAuthGuard)
  findPropertyRooms(
    @Param('id', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.propertiesService.findPropertyRooms(propertyId, paginationDto);
  }

  @Get(':propertyId/rooms/:roomId')
  @UseGuards(JwtAuthGuard)
  findRoomById(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.propertiesService.findRoomById(propertyId, roomId);
  }

  @Patch('/:propertyId/rooms/:roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async updateRoom(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() updateRoomDto: UpdateRoomDto,
    @Request() req: any,
  ) {
    const room = await this.propertiesService.findRoomById(propertyId, roomId);

    // Check if user is the owner or admin
    if (req.user.role !== UserRole.ADMIN) {
      const isOwner = await this.propertiesService.isPropertyOwner(
        room.propertyId,
        req.user.id,
      );
      if (!isOwner) {
        throw new ForbiddenException(
          'You do not have permission to update this room',
        );
      }
    }

    return this.propertiesService.updateRoom(propertyId, roomId, updateRoomDto);
  }

  @Delete(':propertyId/rooms/:roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async removeRoom(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Request() req: any,
  ) {
    const room = await this.propertiesService.findRoomById(propertyId, roomId);

    // Check if user is the owner or admin
    if (req.user.role !== UserRole.ADMIN) {
      const isOwner = await this.propertiesService.isPropertyOwner(
        room.propertyId,
        req.user.id,
      );
      if (!isOwner) {
        throw new ForbiddenException(
          'You do not have permission to delete this room',
        );
      }
    }

    return this.propertiesService.removeRoom(propertyId, roomId);
  }

  @Get('rooms/available/list')
  @UseGuards(JwtAuthGuard)
  findAvailableRooms(@Query() paginationDto: PaginationDto) {
    return this.propertiesService.findAvailableRooms(paginationDto);
  }
}
