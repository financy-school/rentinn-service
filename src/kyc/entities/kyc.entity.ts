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
  @Column({ primary: true, type: 'varchar' })
  id: string;

  @Column()
  documentType: string;

  @Column()
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

  @ManyToOne(() => Tenant, (tenant) => tenant.kycDocuments)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'varchar' })
  tenantId: string;

  @Column({ default: null, nullable: true })
  verifiedBy: number;

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
