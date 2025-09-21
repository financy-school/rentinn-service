import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rental } from './rental.entity';
import { Invoice } from '../../finance/entities/invoice.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentDate: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isLatePayment: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  lateFee: number;

  @Column({ nullable: true })
  recordedBy: number;

  @ManyToOne(() => Rental, (rental) => rental.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rentalId' })
  rental: Rental;

  @Column()
  rentalId: number;

  // Relationship with Invoice
  @ManyToOne(() => Invoice, (invoice) => invoice.payments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ nullable: true })
  invoiceId: number;

  // Relationship with Tenant (for direct tenant payments)
  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  paymentTenantId: string; // UUID for tenant

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
