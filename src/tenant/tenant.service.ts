import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Room } from '../properties/entities/room.entity';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { Property } from '../properties/entities/property.entity';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const room = await this.roomRepository.findOne({
      where: { room_id: createTenantDto.room_id },
    });

    if (!room) throw new NotFoundException('Room not found');

    const tenant = this.tenantRepository.create({
      tenant_id: `TENANT-${uuidv7()}`,
      name: createTenantDto.name,
      phone_number: createTenantDto.phone,
      alternate_phone: createTenantDto.alternatePhone,
      email: createTenantDto.email,
      tenant_type: createTenantDto.tenantType,
      agreement_period: createTenantDto.agreementPeriod,
      lock_in_period: createTenantDto.lockInPeriod,
      add_rent_on: createTenantDto.addRentOn
        ? new Date(createTenantDto.addRentOn)
        : null,
      check_in_date: new Date(createTenantDto.checkInDate),
      check_out_date: createTenantDto.checkOutDate
        ? new Date(createTenantDto.checkOutDate)
        : null,
      room,
      property_id: createTenantDto.property_id,
      room_id: createTenantDto.room_id,
      image_id_list: createTenantDto.image_id_list,
      rent_amount: room.rentAmount,
    });

    if (room.available_count < 1) {
      await this.roomRepository.update(room.room_id, {
        status: 'OCCUPIED',
        available_count: 0,
      });
    } else {
      await this.roomRepository.update(room.room_id, {
        available_count: room.available_count - 1,
      });
    }

    return this.tenantRepository.save(tenant);
  }

  async findAll({
    property_id,
    page = 1,
    limit = 10,
  }: PaginationDto): Promise<PaginationResponse<Tenant>> {
    const [items, total] = await this.tenantRepository.findAndCount({
      where: { property_id },
      relations: ['room'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findPropertyTenants(property_id: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    // Check if property exists
    await this.findPropertyById(property_id);

    const [tenants] = await this.tenantRepository.findAndCount({
      where: { property_id },
      skip,
      take: limit,
    });

    return tenants;
  }

  async findActive({ page = 1, limit = 10 }: PaginationDto): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: { is_active: true },
      relations: ['room'],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async searchTenants(
    query: string,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<Tenant[]> {
    return this.tenantRepository.find({
      where: [
        { name: ILike(`%${query}%`) },
        { phone_number: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
        { id_proof_number: ILike(`%${query}%`) },
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['room'],
    });
  }

  async findByProperty(
    property_id: string,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<Tenant[]> {
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.room', 'room')
      .where('room.property_id = :property_id', { property_id })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('tenant.created_at', 'DESC')
      .getMany();
  }

  async findOne(tenant_id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { tenant_id },
      relations: ['room'],
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(
    tenant_id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    const tenant = await this.findOne(tenant_id);

    if (updateTenantDto.room_id) {
      const room = await this.roomRepository.findOne({
        where: { room_id: updateTenantDto.room_id },
      });

      if (!room) throw new NotFoundException('Room not found');
      tenant.room = room;
    }

    Object.assign(tenant, {
      name: updateTenantDto.name ?? tenant.name,
      phone_number: updateTenantDto.phoneNumber ?? tenant.phone_number,
      email: updateTenantDto.email ?? tenant.email,
      id_proof_type: updateTenantDto.idProofType ?? tenant.id_proof_type,
      id_proof_number: updateTenantDto.idProofNumber ?? tenant.id_proof_number,
      check_in_date: updateTenantDto.checkInDate
        ? new Date(updateTenantDto.checkInDate)
        : tenant.check_in_date,
      check_out_date: updateTenantDto.checkOutDate
        ? new Date(updateTenantDto.checkOutDate)
        : tenant.check_out_date,
    });

    return this.tenantRepository.save(tenant);
  }

  async checkOut(tenant_id: string, checkOutDate?: string): Promise<Tenant> {
    const tenant = await this.findOne(tenant_id);

    if (tenant.check_out_date)
      throw new BadRequestException('Tenant already checked out');

    tenant.check_out_date = checkOutDate ? new Date(checkOutDate) : new Date();

    tenant.is_active = false;

    return this.tenantRepository.save(tenant);
  }

  async remove(tenant_id: string): Promise<void> {
    const tenant = await this.findOne(tenant_id);
    tenant.is_active = false;
    tenant.is_deleted = true;
    await this.tenantRepository.delete(tenant_id);
  }

  async findPropertyById(property_id: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { property_id },
      relations: ['rooms', 'owner'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${property_id} not found`);
    }

    return property;
  }

  async findByRoom(
    room_id: string,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<Tenant[]> {
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.room', 'room')
      .where('room.room_id = :room_id', { room_id })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('tenant.created_at', 'DESC')
      .getMany();
  }

  async findByPropertyAndRoom(
    property_id: string,
    room_id: string,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<Tenant[]> {
    return this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.room', 'room')
      .where('room.room_id = :room_id', { room_id })
      .andWhere('room.property_id = :property_id', { property_id })
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('tenant.created_at', 'DESC')
      .getMany();
  }

  async putOnNotice(tenant_id: string): Promise<Tenant> {
    const tenant = await this.findOne(tenant_id);
    tenant.is_on_notice = true;
    return this.tenantRepository.save(tenant);
  }
}
