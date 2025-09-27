import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Rental } from './entities/rental.entity';
import { Payment } from './entities/payment.entity';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { PropertiesService } from '../properties/properties.service';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { KycService } from '../kyc/kyc.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly propertiesService: PropertiesService,
    private readonly kycService: KycService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new rental agreement
   */
  async create(createRentalDto: CreateRentalDto): Promise<Rental> {
    // Get the room to check if it's available and get rent amount
    const room = await this.propertiesService.findRoomById(
      createRentalDto.propertyId,
      createRentalDto.roomId,
    );

    if (!room.available) {
      throw new BadRequestException('Room is not available for rent');
    }

    // Check if room has any active rentals
    if (room.rentals && room.rentals.some((rental) => rental.isActive)) {
      throw new ConflictException('Room already has an active rental');
    }

    // Check if tenant has verified KYC
    const hasVerifiedKyc = await this.kycService.hasVerifiedKyc(
      createRentalDto.tenantId,
    );
    if (!hasVerifiedKyc) {
      throw new BadRequestException(
        'Tenant must have at least one verified KYC document',
      );
    }

    // Use room's rent amount if not specified
    if (!createRentalDto.rentAmount) {
      createRentalDto.rentAmount = room.rentAmount;
    }

    // Use room's security deposit if not specified
    if (!createRentalDto.securityDeposit) {
      createRentalDto.securityDeposit = room.securityAmount;
    }

    // Set outstanding amount to initial rent
    const outstandingAmount = createRentalDto.rentAmount;

    // Create rental with transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the rental
      const newRental = this.rentalRepository.create({
        ...createRentalDto,
        outstandingAmount,
        rental_id: `RENTAL-${uuidv7()}`,
        startDate: new Date(createRentalDto.startDate),
        endDate: createRentalDto.endDate
          ? new Date(createRentalDto.endDate)
          : null,
      });

      const savedRental = await queryRunner.manager.save(newRental);

      // Update room availability
      await queryRunner.manager.update(
        room.constructor,
        { room_id: room.room_id },
        { isAvailable: false },
      );

      await queryRunner.commitTransaction();
      return savedRental;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all rentals with pagination
   */
  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Rental>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [rentals, total] = await this.rentalRepository.findAndCount({
      relations: ['tenant', 'room', 'room.property', 'payments'],
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items: rentals,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find rentals for a specific landlord
   */
  async findLandlordRentals(
    landlordId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Rental>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoinAndSelect('rental.room', 'room')
      .innerJoinAndSelect('room.property', 'property')
      .innerJoinAndSelect('rental.tenant', 'tenant')
      .leftJoinAndSelect('rental.payments', 'payment')
      .where('property.ownerId = :landlordId', { landlordId });

    const [rentals, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('rental.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items: rentals,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find rentals for a specific tenant
   */
  async findTenantRentals(
    tenantId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Rental>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [rentals, total] = await this.rentalRepository.findAndCount({
      where: { tenantId },
      relations: ['room', 'room.property', 'payments'],
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items: rentals,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find a specific rental by ID
   */
  async findOne(id: string): Promise<Rental> {
    const rental = await this.rentalRepository.findOne({
      where: { rental_id: id },
      relations: ['tenant', 'room', 'room.property', 'payments'],
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${id} not found`);
    }

    return rental;
  }

  /**
   * Update a rental
   */
  async update(id: string, updateRentalDto: UpdateRentalDto): Promise<Rental> {
    const rental = await this.findOne(id);

    // Handle date conversions if present
    if (updateRentalDto.startDate) {
      updateRentalDto.startDate = new Date(
        updateRentalDto.startDate,
      ).toISOString();
    }

    if (updateRentalDto.endDate) {
      updateRentalDto.endDate = new Date(updateRentalDto.endDate).toISOString();
    }

    // Update rental object
    Object.assign(rental, updateRentalDto);

    // If rental is deactivated, make room available again
    if (rental.isActive === false) {
      const room = await this.propertiesService.findRoomById(
        rental.property_id,
        rental.roomId,
      );
      room.available = true;
      await this.propertiesService.updateRoom(room.property_id, room.room_id, {
        available: true,
      });
    }

    return this.rentalRepository.save(rental);
  }

  /**
   * Record a payment for a rental
   */
  async recordPayment(
    rental_id: string,
    recordPaymentDto: RecordPaymentDto,
  ): Promise<Payment> {
    const rental = await this.findOne(rental_id);

    // Create payment transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the payment record
      const newPayment = this.paymentRepository.create({
        ...recordPaymentDto,
        rental_id,
        recordedBy: recordPaymentDto.recordedById,
        paymentDate: new Date(recordPaymentDto.paymentDate),
      });

      const savedPayment = await queryRunner.manager.save(newPayment);

      // Update rental outstanding amount and payment status
      const currentOutstanding = rental.outstandingAmount;
      const newOutstanding = Math.max(
        0,
        currentOutstanding - recordPaymentDto.amount,
      );

      let paymentStatus = PaymentStatus.PENDING;
      if (newOutstanding === 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (newOutstanding < currentOutstanding) {
        paymentStatus = PaymentStatus.PARTIALLY_PAID;
      }

      await queryRunner.manager.update(
        rental.constructor,
        { rental_id },
        {
          outstandingAmount: newOutstanding,
          paymentStatus,
        },
      );

      await queryRunner.commitTransaction();
      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Remove a rental
   */
  async remove(rental_id: string, room_id: string): Promise<void> {
    const rental = await this.findOne(rental_id);

    // Free up the room if rental is active
    if (rental.isActive) {
      const room = await this.propertiesService.findRoomById(
        rental.property_id,
        room_id,
      );
      room.available = true;
      await this.propertiesService.updateRoom(room.property_id, room.room_id, {
        available: true,
      });
    }

    await this.rentalRepository.remove(rental);
  }

  /**
   * Get overdue rentals
   */
  async findOverdueRentals(
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Rental>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const today = new Date();
    const dayOfMonth = today.getDate();

    const queryBuilder = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoinAndSelect('rental.tenant', 'tenant')
      .innerJoinAndSelect('rental.room', 'room')
      .innerJoinAndSelect('room.property', 'property')
      .where('rental.isActive = :isActive', { isActive: true })
      .andWhere('rental.paymentStatus != :paidStatus', {
        paidStatus: PaymentStatus.PAID,
      })
      .andWhere('rental.rentDueDay < :dayOfMonth', { dayOfMonth })
      .andWhere('rental.outstandingAmount > 0');

    const [rentals, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: rentals,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Check if user is the landlord for a rental
   */
  async isRentalLandlord(rental_id: string, user_id: string): Promise<boolean> {
    const rental = await this.rentalRepository.findOne({
      where: { rental_id },
      relations: ['room', 'room.property'],
    });

    if (!rental) {
      return false;
    }

    return rental.room.property.owner_id === user_id;
  }

  /**
   * Check if user is the tenant for a rental
   */
  async isRentalTenant(rental_id: string, userId: string): Promise<boolean> {
    const rental = await this.rentalRepository.findOne({
      where: { rental_id, tenantId: userId },
    });

    return !!rental;
  }
}
