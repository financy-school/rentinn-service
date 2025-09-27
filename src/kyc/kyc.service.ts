import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc } from './entities/kyc.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { CreateKycDto } from './dto/create-kyc.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { KycStatus } from '../common/enums/kyc-status.enum';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Create a new KYC document for a tenant
   */
  async create(createKycDto: CreateKycDto): Promise<Kyc> {
    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { tenant_id: createKycDto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createKycDto.tenantId} not found`,
      );
    }

    const newKyc = this.kycRepository.create({
      kyc_id: `KYC-${uuidv7()}`,
      ...createKycDto,
      tenantId: createKycDto.tenantId,
    });

    return this.kycRepository.save(newKyc);
  }

  /**
   * Find all KYC documents with pagination
   */
  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Kyc>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      relations: ['tenant'],
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
   * Find all KYC documents for a specific tenant
   */
  async findByTenant(
    tenantId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Kyc>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      where: { tenantId },
      relations: ['tenant'],
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
  async findOne(kyc_id: string): Promise<Kyc> {
    const kyc = await this.kycRepository.findOne({
      where: { kyc_id },
      relations: ['tenant'],
    });

    if (!kyc) {
      throw new NotFoundException(`KYC document with ID ${kyc_id} not found`);
    }

    return kyc;
  }

  /**
   * Update a KYC document
   */
  async update(kyc_id: string, updateKycDto: UpdateKycDto): Promise<Kyc> {
    const kyc = await this.findOne(kyc_id);

    // If status is changing to VERIFIED, record verification details
    if (
      updateKycDto.status === KycStatus.VERIFIED &&
      kyc.status !== KycStatus.VERIFIED
    ) {
      kyc.verifiedAt = new Date();
    }

    const updatedKyc = Object.assign(kyc, updateKycDto);
    return this.kycRepository.save(updatedKyc);
  }

  /**
   * Verify a KYC document
   */
  async verify(
    kyc_id: string,
    adminId: number,
    status: KycStatus,
    notes?: string,
  ): Promise<Kyc> {
    const kyc = await this.findOne(kyc_id);

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
  async remove(kyc_id: string): Promise<void> {
    const kyc = await this.findOne(kyc_id);
    await this.kycRepository.remove(kyc);
  }

  /**
   * Find pending KYC verifications
   */
  async findPendingVerifications(
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Kyc>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      where: { status: KycStatus.PENDING },
      relations: ['tenant'],
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
   * Check if tenant has any verified KYC document
   */
  async hasVerifiedKyc(tenantId: string): Promise<boolean> {
    const count = await this.kycRepository.count({
      where: {
        tenantId,
        status: KycStatus.VERIFIED,
      },
    });

    return count > 0;
  }
}
