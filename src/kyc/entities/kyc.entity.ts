import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { KycStatus } from '../../common/enums/kyc-status.enum';

@Entity('kyc_documents')
export class Kyc {
  @Column({ primary: true, type: 'varchar', length: 70 })
  kyc_id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  kyc_token: string;

  @Column({ type: 'timestamp', nullable: true })
  token_expires_at: Date;

  @Column({ type: 'varchar', length: 100, default: null, nullable: true })
  documentType: string;

  @Column({ type: 'varchar', length: 100, default: null, nullable: true })
  documentNumber: string;

  @Column({ nullable: true })
  documentUrl: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ nullable: true })
  verificationNotes: string;

  @Column({ nullable: true })
  issuedBy: string;

  @Column({ nullable: true })
  issuedDate: Date;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  agreement_document_id: string;

  @Column({ type: 'boolean', default: false })
  agreement_signed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  agreement_signed_at: Date;

  @Column({ type: 'text', nullable: true })
  tenant_signature: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice_id: string;

  @Column({ type: 'boolean', default: false })
  invoice_generated: boolean;

  @ManyToOne(() => Tenant, (tenant) => tenant.kycDocuments)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', default: null, nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', default: null, nullable: true })
  user_id: string;

  @Column({ default: null, nullable: true, type: 'varchar' })
  verifiedBy: string;

  @Column({ default: null, nullable: true })
  verifiedAt: Date;

  @Column({ default: null, nullable: true })
  expiryAlertSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  // Check if document is expired
  get isExpired(): boolean {
    if (!this.expiryDate) {
      return false;
    }
    return new Date(this.expiryDate) < new Date();
  }

  get expiresSoon(): boolean {
    if (!this.expiryDate) {
      return false;
    }
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(this.expiryDate) <= thirtyDaysFromNow;
  }
}
