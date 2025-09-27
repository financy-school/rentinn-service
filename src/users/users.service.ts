import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { PropertiesService } from '../properties/properties.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly propertyService: PropertiesService,
  ) {}

  /**
   * Creates a new user with hashed password
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(createUserDto.password);

    // Create new user
    const newUser = this.userRepository.create({
      ...createUserDto,
      user_id: `USER-${uuidv7()}`, // Simple unique ID generation; replace with UUID in production
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);

    // create a new entry in property table if the user is a landlord
    // if (createUserDto.role === UserRole.LANDLORD) {
    //   const property = await this.propertyService.createProperty(newUser.id, {
    //     name: `${newUser.firstName}'s Property`,
    //     description: 'Default property created for landlord',
    //     address: createUserDto.address || 'Default Address',
    //     city: createUserDto.city || 'Default City',
    //     state: createUserDto.state || 'Default State',
    //     postalCode: createUserDto.postalCode || '00000',
    //     country: createUserDto.country || 'Default Country',
    //   });
    //   newUser.properties = [property];
    //   await this.userRepository.save(newUser);
    // }

    return newUser;
  }

  /**
   * Find all users with pagination
   */
  async findAll(
    paginationDto: PaginationDto,
    role?: UserRole,
  ): Promise<PaginationResponse<User>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.where('user.role = :role', { role });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: users,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find a specific user by ID
   */
  async findOne(user_id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return user;
  }

  /**
   * Find a user by their email
   */
  async findByEmail(email: string) {
    // First find the user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    let property_id: string;
    // If the user is a landlord, load their properties
    if (user.role === UserRole.LANDLORD) {
      // Load properties for landlords with explicit selection of the id field
      property_id = (
        await this.propertyService.findPropertiesByOwnerId(user.user_id)
      ).property_id;

      // Ensure each property has an id in the response
    }

    return { ...user, property_id };
  }

  /**
   * Update user information
   */
  async update(user_id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(user_id);

    // If email is being updated, check if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Delete a user
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Find tenants for a landlord
   */
  async findTenants(
    landlordId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<User>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    // Get all rentals from landlord's properties
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.rentalsAsTenant', 'rental')
      .innerJoin('rental.room', 'room')
      .innerJoin('room.property', 'property')
      .where('property.ownerId = :landlordId', { landlordId })
      .andWhere('user.role = :role', { role: UserRole.TENANT });

    const [tenants, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: tenants,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Utility method to hash passwords
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
