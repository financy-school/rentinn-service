import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { NotificationService } from '../client/notification/notification.service';

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
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new rental agreement
   */
  async create(
    createRentalDto: CreateRentalDto,
    user_id: string,
  ): Promise<Rental> {
    // Get the room to check if it's available and get rent amount
    const room = await this.propertiesService.findRoomById(
      createRentalDto.property_id,
      createRentalDto.room_id,
      user_id,
    );

    if (!room.available) {
      throw new BadRequestException('Room is not available for rent');
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
        room: room,
        tenant_id: createRentalDto.tenant_id,
        property_id: createRentalDto.property_id,
        isActive: true,
      });

      const savedRental = await queryRunner.manager.save(newRental);

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
    user_id: string,
  ): Promise<PaginationResponse<Rental>> {
    const { property_id, page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.rentalRepository
      .createQueryBuilder('rental')
      .innerJoinAndSelect('rental.room', 'room')
      .innerJoinAndSelect('room.property', 'property')
      .innerJoinAndSelect('rental.tenant', 'tenant')
      .leftJoinAndSelect('rental.payments', 'payment')
      .where('property.owner_id = :user_id', { user_id });

    // Only filter by property_id if it's provided and not 'all'
    if (property_id && property_id !== 'all') {
      queryBuilder.andWhere('rental.property_id = :property_id', {
        property_id,
      });
    }

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
   * Find rentals for a specific landlord
   */
  async findLandlordRentals(
    landlordId: string,
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
      .where('property.owner_id = :landlordId', { landlordId });

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
    tenant_id: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Rental>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [rentals, total] = await this.rentalRepository.findAndCount({
      where: { tenant_id },
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
  async findOne(rental_id: string, user_id: string): Promise<Rental> {
    const rental = await this.rentalRepository.findOne({
      where: { rental_id },
      relations: ['tenant', 'room', 'room.property', 'payments'],
    });

    if (!rental) {
      throw new NotFoundException(`Rental with ID ${rental_id} not found`);
    }

    // Check if user has access to this rental (is the landlord)
    if (!(await this.isRentalLandlord(rental_id, user_id))) {
      throw new ForbiddenException('You do not have access to this rental');
    }

    return rental;
  }

  /**
   * Update a rental
   */
  async update(
    rental_id: string,
    updateRentalDto: UpdateRentalDto,
    user_id: string,
  ): Promise<Rental> {
    const rental = await this.findOne(rental_id, user_id);

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
        rental.room_id,
        user_id,
      );
      room.available = true;
      await this.propertiesService.updateRoom(
        room.property_id,
        room.room_id,
        {
          available: true,
        },
        user_id,
      );
    }

    return this.rentalRepository.save(rental);
  }

  /**
   * Record a payment for a rental
   */
  async recordPayment(
    rental_id: string,
    recordPaymentDto: RecordPaymentDto,
    user_id: string,
  ): Promise<Payment> {
    const rental = await this.findOne(rental_id, user_id);

    // Create payment transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the payment record
      const newPayment = this.paymentRepository.create({
        payment_tenant_id: rental.tenant_id,
        amount: recordPaymentDto.amount,
        rental_id: rental.rental_id,
        property_id: rental.property_id,
        notes: recordPaymentDto.notes,
        paymentMethod: recordPaymentDto.paymentMethod,
        transactionId: recordPaymentDto.transactionId,
        payment_id: `PAYMENT-${uuidv7()}`,
        rental: rental,
        invoice_id: recordPaymentDto.invoice_id || null,
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

      // Send payment notification email to landlord
      try {
        const landlord = await this.propertiesService.findPropertyById(
          rental.property_id,
          user_id,
        );

        const property = await this.propertiesService.findPropertyById(
          rental.property_id,
          user_id,
        );

        if (landlord.owner && landlord.owner.email) {
          await this.notificationService.sendPaymentReceivedEmail(
            landlord.owner.email,
            `${landlord.owner.firstName} ${landlord.owner.lastName}`,
            landlord.owner_id,
            rental.tenant.name,
            property.address,
            recordPaymentDto.amount,
            recordPaymentDto.paymentDate,
          );
        }
      } catch (error) {
        console.error('Failed to send payment notification email:', error);
        // Don't fail payment recording if email fails
      }

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
  async remove(
    rental_id: string,
    room_id: string,
    user_id: string,
  ): Promise<void> {
    const rental = await this.findOne(rental_id, user_id);

    // Free up the room if rental is active
    if (rental.isActive) {
      const room = await this.propertiesService.findRoomById(
        rental.property_id,
        room_id,
        user_id,
      );
      room.available = true;
      await this.propertiesService.updateRoom(
        room.property_id,
        room.room_id,
        {
          available: true,
        },
        user_id,
      );
    }

    await this.rentalRepository.remove(rental);
  }

  /**
   * Get overdue rentals
   */
  async findOverdueRentals(
    paginationDto: PaginationDto,
    user_id: string,
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
      .andWhere('property.owner_id = :user_id', { user_id })
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
  async isRentalTenant(rental_id: string, user_id: string): Promise<boolean> {
    const rental = await this.rentalRepository.findOne({
      where: { rental_id, tenant_id: user_id },
    });

    return !!rental;
  }

  /**
   * Find all payments with pagination and property filtering
   */
  async findPayments(
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<PaginationResponse<Payment>> {
    const { property_id, page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.rental', 'rental')
      .leftJoin('rental.room', 'room')
      .leftJoin('room.property', 'property')
      .where('property.owner_id = :user_id', { user_id });

    // Only filter by property_id if it's provided and not 'all'
    if (property_id && property_id !== 'all') {
      queryBuilder.andWhere('payment.property_id = :property_id', {
        property_id,
      });
    }

    const [payments, total] = await queryBuilder
      .leftJoinAndSelect('payment.rental', 'rental_select')
      .leftJoinAndSelect('rental_select.tenant', 'tenant')
      .skip(skip)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items: payments,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }
}
