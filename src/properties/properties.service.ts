import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Property } from './entities/property.entity';
import { Room } from './entities/room.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * Create a new property
   */
  async createProperty(userId: number, createPropertyDto: CreatePropertyDto): Promise<Property> {
    const newProperty = this.propertyRepository.create({
      ...createPropertyDto,
      ownerId: userId,
    });

    return this.propertyRepository.save(newProperty);
  }

  /**
   * Get all properties with pagination and filtering
   */
  async findAllProperties(
    paginationDto: PaginationDto, 
    userId?: number,
    userRole?: UserRole
  ): Promise<PaginationResponse<Property>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Property> = {};
    
    // If user is landlord, only show their properties
    if (userRole === UserRole.LANDLORD && userId) {
      where.ownerId = userId;
    }

    const [properties, total] = await this.propertyRepository.findAndCount({
      where,
      relations: ['rooms'],
      skip,
      take: limit,
    });

    return {
      items: properties,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find property by ID
   */
  async findPropertyById(id: number): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ['rooms', 'owner'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  /**
   * Update property
   */
  async updateProperty(id: number, updatePropertyDto: UpdatePropertyDto): Promise<Property> {
    const property = await this.findPropertyById(id);
    
    // Update and save
    this.propertyRepository.merge(property, updatePropertyDto);
    return this.propertyRepository.save(property);
  }

  /**
   * Remove property
   */
  async removeProperty(id: number): Promise<void> {
    const property = await this.findPropertyById(id);
    await this.propertyRepository.remove(property);
  }

  /**
   * Add room to property
   */
  async createRoom(propertyId: number, createRoomDto: CreateRoomDto): Promise<Room> {
    // Check if property exists
    const property = await this.findPropertyById(propertyId);
    
    const newRoom = this.roomRepository.create({
      ...createRoomDto,
      propertyId,
    });
    
    return this.roomRepository.save(newRoom);
  }

  /**
   * Get all rooms in a property
   */
  async findPropertyRooms(
    propertyId: number, 
    paginationDto: PaginationDto
  ): Promise<PaginationResponse<Room>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    
    // Check if property exists
    await this.findPropertyById(propertyId);
    
    const [rooms, total] = await this.roomRepository.findAndCount({
      where: { propertyId },
      relations: ['rentals'],
      skip,
      take: limit,
    });

    return {
      items: rooms,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find room by ID
   */
  async findRoomById(id: number): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['property', 'rentals'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  /**
   * Update room
   */
  async updateRoom(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findRoomById(id);
    
    // Update and save
    this.roomRepository.merge(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  /**
   * Remove room
   */
  async removeRoom(id: number): Promise<void> {
    const room = await this.findRoomById(id);
    
    // Check if room has active rentals
    if (room.rentals && room.rentals.some(rental => rental.isActive)) {
      throw new BadRequestException('Cannot delete room with active rentals');
    }
    
    await this.roomRepository.remove(room);
  }

  /**
   * Find available rooms
   */
  async findAvailableRooms(paginationDto: PaginationDto): Promise<PaginationResponse<Room>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.roomRepository.createQueryBuilder('room')
      .where('room.isAvailable = :isAvailable', { isAvailable: true })
      .leftJoin('room.rentals', 'rental', 'rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.id IS NULL') // No active rentals
      .leftJoinAndSelect('room.property', 'property');
    
    const [rooms, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: rooms,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Check if a user is the owner of a property
   */
  async isPropertyOwner(propertyId: number, userId: number): Promise<boolean> {
    const property = await this.propertyRepository.findOne({
      where: { id: propertyId, ownerId: userId },
    });
    
    return !!property;
  }
}
