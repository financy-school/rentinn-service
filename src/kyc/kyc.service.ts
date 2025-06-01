import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc } from './entities/kyc.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { KycStatus } from '../common/enums/kyc-status.enum';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
  ) {}

  /**
   * Create a new KYC document for a user
   */
  async create(userId: number, createKycDto: CreateKycDto): Promise<Kyc> {
    const newKyc = this.kycRepository.create({
      ...createKycDto,
      userId,
    });

    return this.kycRepository.save(newKyc);
  }

  /**
   * Find all KYC documents with pagination
   */
  async findAll(paginationDto: PaginationDto): Promise<PaginationResponse<Kyc>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      relations: ['user'],
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items: kycs,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find all KYC documents for a specific user
   */
  async findByUser(userId: number, paginationDto: PaginationDto): Promise<PaginationResponse<Kyc>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items: kycs,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Find a specific KYC document by ID
   */
  async findOne(id: number): Promise<Kyc> {
    const kyc = await this.kycRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!kyc) {
      throw new NotFoundException(`KYC document with ID ${id} not found`);
    }

    return kyc;
  }

  /**
   * Update a KYC document
   */
  async update(id: number, updateKycDto: UpdateKycDto): Promise<Kyc> {
    const kyc = await this.findOne(id);
    
    // If status is changing to VERIFIED, record verification details
    if (updateKycDto.status === KycStatus.VERIFIED && kyc.status !== KycStatus.VERIFIED) {
      kyc.verifiedAt = new Date();
    }
    
    const updatedKyc = Object.assign(kyc, updateKycDto);
    return this.kycRepository.save(updatedKyc);
  }

  /**
   * Verify a KYC document
   */
  async verify(id: number, adminId: number, status: KycStatus, notes?: string): Promise<Kyc> {
    const kyc = await this.findOne(id);
    
    // Cannot verify already verified or rejected documents
    if (kyc.status !== KycStatus.PENDING) {
      throw new BadRequestException(`Document is already ${kyc.status}`);
    }
    
    kyc.status = status;
    kyc.verificationNotes = notes;
    kyc.verifiedBy = adminId;
    kyc.verifiedAt = new Date();
    
    return this.kycRepository.save(kyc);
  }

  /**
   * Remove a KYC document
   */
  async remove(id: number): Promise<void> {
    const kyc = await this.findOne(id);
    await this.kycRepository.remove(kyc);
  }

  /**
   * Find pending KYC verifications
   */
  async findPendingVerifications(paginationDto: PaginationDto): Promise<PaginationResponse<Kyc>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      where: { status: KycStatus.PENDING },
      relations: ['user'],
      skip,
      take: limit,
      order: {
        createdAt: 'ASC', // Oldest first
      },
    });

    return {
      items: kycs,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  /**
   * Check if user has any verified KYC document
   */
  async hasVerifiedKyc(userId: number): Promise<boolean> {
    const count = await this.kycRepository.count({
      where: {
        userId,
        status: KycStatus.VERIFIED,
      },
    });
    
    return count > 0;
  }
}
