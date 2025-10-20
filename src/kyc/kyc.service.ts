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
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Generate a secure KYC token
   */
  private generateKycToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new KYC document for a tenant
   */
  async create(createKycDto: CreateKycDto, user_id: string): Promise<Kyc> {
    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { tenant_id: createKycDto.tenant_id, user_id: user_id },
      relations: ['room'],
    });
    if (!tenant) {
      throw new NotFoundException(
        `Tenant with ID ${createKycDto.tenant_id} not found`,
      );
    }

    // Generate token that expires in 7 days
    const kycToken = this.generateKycToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    const newKyc = this.kycRepository.create({
      kyc_id: `KYC-${uuidv4()}`,
      ...createKycDto,
      tenant_id: createKycDto.tenant_id,
      user_id: user_id,
      status: KycStatus.PENDING,
      kyc_token: kycToken,
      token_expires_at: tokenExpiresAt,
    });

    return this.kycRepository.save(newKyc);
  }

  /**
   * Find KYC by token (for public access)
   */
  async findByToken(token: string): Promise<Kyc> {
    const kyc = await this.kycRepository.findOne({
      where: { kyc_token: token },
      relations: ['tenant', 'tenant.room'],
    });

    if (!kyc) {
      throw new NotFoundException('Invalid KYC token');
    }

    if (new Date() > kyc.token_expires_at) {
      throw new BadRequestException('KYC token has expired');
    }

    return kyc;
  }

  /**
   * Verify document via DigiLocker (placeholder for actual integration)
   */
  async verifyDocument(
    token: string,
    documentType: string,
    documentNumber: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const kyc = await this.findByToken(token);

    // TODO: Integrate with actual DigiLocker API
    // For now, we'll do basic validation
    if (!documentType || !documentNumber) {
      return {
        success: false,
        error: 'Document type and number are required',
      };
    }

    // Update KYC with document details
    kyc.documentType = documentType;
    kyc.documentNumber = documentNumber;
    kyc.status = KycStatus.IN_REVIEW;

    await this.kycRepository.save(kyc);

    return {
      success: true,
      data: {
        name: kyc.tenant.name,
        documentNumber: documentNumber,
        isValid: true,
      },
    };
  }

  /**
   * Sign rental agreement
   */
  async signAgreement(
    token: string,
    signature: string,
  ): Promise<{ success: boolean; error?: string }> {
    const kyc = await this.findByToken(token);

    if (!signature) {
      return { success: false, error: 'Signature is required' };
    }

    kyc.tenant_signature = signature;
    kyc.agreement_signed = true;
    kyc.agreement_signed_at = new Date();

    await this.kycRepository.save(kyc);

    return { success: true };
  }

  /**
   * Find all KYC documents with pagination
   */
  async findAll(
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<PaginationResponse<Kyc>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const { property_id } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.kycRepository
      .createQueryBuilder('kyc')
      .leftJoinAndSelect('kyc.tenant', 'tenant')
      .where('kyc.user_id = :user_id', { user_id })
      .orderBy('kyc.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (property_id && property_id !== 'all') {
      queryBuilder
        .leftJoin('tenant.rentals', 'rental')
        .leftJoin('rental.room', 'room')
        .leftJoin('room.property', 'property')
        .andWhere('property.property_id = :property_id', { property_id });
    }

    const [kycs, total] = await queryBuilder.getManyAndCount();

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
    tenant_id: string,
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<PaginationResponse<Kyc>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const skip = (page - 1) * limit;

    const [kycs, total] = await this.kycRepository.findAndCount({
      where: { tenant_id, user_id },
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
  async findOne(kyc_id: string, user_id: string): Promise<Kyc> {
    const kyc = await this.kycRepository.findOne({
      where: { kyc_id, user_id },
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
  async update(
    kyc_id: string,
    updateKycDto: UpdateKycDto,
    user_id: string,
  ): Promise<Kyc> {
    const kyc = await this.findOne(kyc_id, user_id);

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
    user_id: string,
    status: KycStatus,
    notes?: string,
  ): Promise<Kyc> {
    const kyc = await this.findOne(kyc_id, user_id);

    // Cannot verify already verified or rejected documents
    if (kyc.status !== KycStatus.PENDING) {
      throw new BadRequestException(`Document is already ${kyc.status}`);
    }

    kyc.status = status;
    kyc.verificationNotes = notes;
    kyc.verifiedBy = user_id;
    kyc.verifiedAt = new Date();

    return this.kycRepository.save(kyc);
  }

  /**
   * Remove a KYC document
   */
  async remove(kyc_id: string, user_id: string): Promise<void> {
    const kyc = await this.findOne(kyc_id, user_id);
    await this.kycRepository.remove(kyc);
  }

  /**
   * Find pending KYC verifications
   */
  async findPendingVerifications(
    paginationDto: PaginationDto,
    user_id: string,
  ): Promise<PaginationResponse<Kyc>> {
    const page = paginationDto.getSafePage();
    const limit = paginationDto.getSafeLimit();
    const { property_id } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.kycRepository
      .createQueryBuilder('kyc')
      .leftJoinAndSelect('kyc.tenant', 'tenant')
      .where('kyc.status = :status', { status: KycStatus.PENDING })
      .andWhere('kyc.user_id = :user_id', { user_id })
      .orderBy('kyc.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    if (property_id && property_id !== 'all') {
      queryBuilder
        .leftJoin('tenant.rentals', 'rental')
        .leftJoin('rental.room', 'room')
        .leftJoin('room.property', 'property')
        .andWhere('property.property_id = :property_id', { property_id });
    }

    const [kycs, total] = await queryBuilder.getManyAndCount();

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
  async hasVerifiedKyc(tenant_id: string): Promise<boolean> {
    const count = await this.kycRepository.count({
      where: {
        tenant_id,
        status: KycStatus.VERIFIED,
      },
    });

    return count > 0;
  }

  /**
   * Generate rental agreement (placeholder - would integrate with document service)
   */
  async generateAgreement(
    token: string,
    agreementData: any,
  ): Promise<{ success: boolean; agreementUrl?: string; error?: string }> {
    const kyc = await this.findByToken(token);

    if (!kyc.documentType || !kyc.documentNumber) {
      return {
        success: false,
        error: 'Please complete document verification first',
      };
    }

    // TODO: Integrate with actual document generation service
    // For now, we'll just mark that agreement is ready
    const agreementId = `AGR-${uuidv4()}`;
    kyc.agreement_document_id = agreementId;

    await this.kycRepository.save(kyc);

    return {
      success: true,
      agreementUrl: `/documents/${agreementId}`,
    };
  }

  /**
   * Complete KYC process and generate invoice
   */
  async completeKyc(
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    const kyc = await this.kycRepository.findOne({
      where: { kyc_token: token },
      relations: ['tenant', 'tenant.room', 'tenant.rentals'],
    });

    if (!kyc) {
      return { success: false, error: 'Invalid KYC token' };
    }

    if (!kyc.agreement_signed) {
      return {
        success: false,
        error: 'Please sign the rental agreement first',
      };
    }

    if (!kyc.documentType || !kyc.documentNumber) {
      return {
        success: false,
        error: 'Please complete document verification first',
      };
    }

    // Mark KYC as completed (landlord still needs to approve)
    kyc.status = KycStatus.IN_REVIEW;

    await this.kycRepository.save(kyc);

    return { success: true };
  }

  /**
   * Landlord approves KYC and generates invoice
   */
  async approveKyc(
    kyc_id: string,
    user_id: string,
  ): Promise<{ success: boolean; error?: string }> {
    const kyc = await this.kycRepository.findOne({
      where: { kyc_id, user_id },
      relations: ['tenant', 'tenant.room', 'tenant.rentals'],
    });

    if (!kyc) {
      return { success: false, error: 'KYC not found' };
    }

    if (kyc.status === KycStatus.VERIFIED) {
      return { success: false, error: 'KYC already approved' };
    }

    // Mark as verified
    kyc.status = KycStatus.VERIFIED;
    kyc.verifiedBy = user_id;
    kyc.verifiedAt = new Date();

    // Generate invoice if not already generated
    if (!kyc.invoice_generated && kyc.tenant.rentals?.length > 0) {
      const rental = kyc.tenant.rentals[0];
      const invoiceId = `INV-${uuidv4()}`;

      // Store invoice ID reference
      kyc.invoice_id = invoiceId;
      kyc.invoice_generated = true;
    }

    await this.kycRepository.save(kyc);

    return { success: true };
  }

  /**
   * Get KYC link for a tenant
   */
  async getKycLink(tenant_id: string, user_id: string): Promise<string> {
    const kycs = await this.kycRepository.find({
      where: { tenant_id, user_id },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (kycs.length === 0 || !kycs[0].kyc_token) {
      throw new NotFoundException('No KYC token found for this tenant');
    }

    const kyc = kycs[0];

    // Check if token is expired
    if (new Date() > kyc.token_expires_at) {
      // Regenerate token
      const newToken = this.generateKycToken();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      kyc.kyc_token = newToken;
      kyc.token_expires_at = newExpiresAt;

      await this.kycRepository.save(kyc);

      return kyc.kyc_token;
    }

    return kyc.kyc_token;
  }
}
