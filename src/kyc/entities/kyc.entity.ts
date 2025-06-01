import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { KycStatus } from '../../common/enums/kyc-status.enum';

@Entity('kyc_documents')
export class Kyc {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => User, user => user.kycDocuments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ nullable: true })
  verifiedBy: number;

  @Column({ nullable: true })
  verifiedAt: Date;

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
}
