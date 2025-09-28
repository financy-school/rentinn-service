import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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
import { v7 as uuidv7 } from 'uuid';
import { randomBytes } from 'crypto';

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
  async createProperty(
    userId: string,
    createPropertyDto: CreatePropertyDto,
  ): Promise<Property> {
    const newProperty = this.propertyRepository.create({
      ...createPropertyDto,
      owner_id: userId,
      property_id: `PROP-${uuidv7()}`,
    });

    return this.propertyRepository.save(newProperty);
  }

  /**
   * Get all properties with pagination and filtering
   */
  async findAllProperties(
    paginationDto: PaginationDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<PaginationResponse<Property>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Property> = {};

    // If user is landlord, only show their properties
    if (userRole === UserRole.LANDLORD && userId) {
      where.owner_id = userId;
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
  async findPropertyById(
    property_id: string,
    user_id: string,
  ): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { property_id },
      relations: ['rooms', 'owner'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${property_id} not found`);
    }

    // Check ownership if user_id is provided
    if (user_id && property.owner_id !== user_id) {
      throw new ForbiddenException('You do not have access to this property');
    }

    return property;
  }

  async findPropertiesByOwnerId(owner_id: string) {
    const properties = await this.propertyRepository.findOne({
      where: { owner_id: owner_id },
    });

    return properties;
  }

  /**
   * Update property
   */
  async updateProperty(
    property_id: string,
    updatePropertyDto: UpdatePropertyDto,
    user_id: string,
  ): Promise<Property> {
    const property = await this.findPropertyById(property_id, user_id);

    // Update and save
    this.propertyRepository.merge(property, updatePropertyDto);
    return this.propertyRepository.save(property);
  }

  /**
   * Remove property
   */
  async removeProperty(property_id: string, user_id: string): Promise<void> {
    const property = await this.findPropertyById(property_id, user_id);
    await this.propertyRepository.remove(property);
  }

  /**
   * Add room to property
   */
  async createRoom(
    property_id: string,
    createRoomDto: CreateRoomDto,
    user_id: string,
  ): Promise<Room> {
    // Check if property exists
    const property = await this.findPropertyById(property_id, user_id);

    if (!property) {
      throw new NotFoundException(`Property with ID ${property_id} not found`);
    }

    const new_room = new Room();
    new_room.room_id = randomBytes(4).toString('hex').toUpperCase();
    new_room.name = createRoomDto.name;
    new_room.areaType = createRoomDto.areaType;
    new_room.rentAmount = createRoomDto.rentAmount;
    new_room.securityAmount = createRoomDto.securityAmount;
    new_room.available = createRoomDto.available;
    new_room.floorNumber = createRoomDto.floorNumber;
    new_room.bedCount = createRoomDto.bedCount;
    new_room.bathroomCount = createRoomDto.bathroomCount;
    new_room.lastElectricityReading = createRoomDto.lastElectricityReading;
    new_room.lastElectricityReadingDate =
      createRoomDto.lastElectricityReadingDate;
    new_room.furnished = createRoomDto.furnished;
    new_room.amenities = createRoomDto.amenities;
    new_room.image_document_id_list = createRoomDto.image_document_id_list;
    new_room.property_id = property_id;
    new_room.property = property;
    new_room.description = createRoomDto.description;
    new_room.status = 'VACANT';

    const newRoom = this.roomRepository.create(new_room);

    return this.roomRepository.save(newRoom);
  }

  /**
   * Get all rooms in a property or all properties
   */
  async findPropertyRooms(
    property_id: string,
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<PaginationResponse<Room>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const skip = (page - 1) * limit;

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.property', 'property')
      .where('property.owner_id = :user_id', { user_id });

    // If property_id is not 'all', filter by specific property
    if (property_id !== 'all') {
      // Check if property exists and user has access
      await this.findPropertyById(property_id, user_id);
      queryBuilder.andWhere('room.property_id = :property_id', { property_id });
    }

    const [rooms, total] = await queryBuilder
      .leftJoinAndSelect('room.rentals', 'rental')
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
   * Find room by ID
   */
  async findRoomById(
    property_id: string,
    room_id: string,
    user_id: string,
  ): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { room_id, property_id, user_id },
      relations: ['property', 'rentals'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${room_id} not found`);
    }

    return room;
  }

  /**
   * Update room
   */
  async updateRoom(
    property_id: string,
    room_id: string,
    updateRoomDto: UpdateRoomDto,
    user_id: string,
  ): Promise<Room> {
    const room = await this.findRoomById(property_id, room_id, user_id);

    // Update and save
    this.roomRepository.merge(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  /**
   * Remove room
   */
  async removeRoom(
    property_id: string,
    room_id: string,
    user_id: string,
  ): Promise<void> {
    const room = await this.findRoomById(property_id, room_id, user_id);

    // Check if room has active rentals
    if (room.rentals && room.rentals.some((rental) => rental.isActive)) {
      throw new BadRequestException('Cannot delete room with active rentals');
    }

    await this.roomRepository.remove(room);
  }

  /**
   * Find available rooms
   */
  async findAvailableRooms(
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<PaginationResponse<Room>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const skip = (page - 1) * limit;

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .where('room.isAvailable = :isAvailable', { isAvailable: true })
      .leftJoin('room.rentals', 'rental', 'rental.isActive = :isActive', {
        isActive: true,
      })
      .andWhere('rental.rental_id IS NULL') // No active rentals
      .andWhere('room.user_id = :user_id', { user_id })
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
  async isPropertyOwner(property_id: string, userId: string): Promise<boolean> {
    const property = await this.propertyRepository.findOne({
      where: { property_id, owner_id: userId },
    });

    return !!property;
  }
}
