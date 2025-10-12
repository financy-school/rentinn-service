import {
  Entity,
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
  @Column({ unique: true, primary: true, length: 70, type: 'varchar' })
  payment_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentDate: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ default: null, nullable: true })
  property_id: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isLatePayment: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  lateFee: number;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  recordedBy: string;

  @ManyToOne(() => Rental, (rental) => rental.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @Column({ type: 'varchar', length: 50 })
  rental_id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ nullable: true, type: 'varchar', length: 200 })
  invoice_id: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenant_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
