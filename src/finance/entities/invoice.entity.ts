import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { InvoiceItem } from './invoice-item.entity';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

@Entity('invoices')
export class Invoice {
  @Column({ primary: true, type: 'varchar', length: 70 })
  invoice_id: string;

  @Column({
    unique: true,
    type: 'varchar',
    length: 100,
    default: null,
    nullable: true,
  })
  invoice_number: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  outstanding_amount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ nullable: true, default: null })
  due_date: Date;

  @Column({ nullable: true, default: null })
  payment_date: Date;

  @Column({ nullable: true, default: null, type: 'varchar', length: 100 })
  invoice_document_id: string;

  @Column({ nullable: true, default: null })
  issue_date: Date;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ default: false })
  is_recurring: boolean;

  @Column({ nullable: true, default: null })
  recurring_frequency: string; // 'MONTHLY', 'QUARTERLY', 'YEARLY'

  @Column({ nullable: true, default: null })
  next_recurring_date: Date;

  @Column({ default: false })
  send_reminder: boolean;

  @Column({ nullable: true, default: null })
  last_reminder_sent: Date;

  // Relationships
  @ManyToOne(() => Tenant, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 50, default: null, nullable: true })
  tenant_id: string;

  @Column({ type: 'varchar', length: 50, default: null, nullable: true })
  property_id: string;

  @Column({ type: 'varchar', length: 50, default: null, nullable: true })
  room_id: string;

  @Column({ nullable: true, type: 'varchar', length: 150 })
  user_id: string;

  @ManyToOne(() => Rental, (rental) => rental.invoices, { nullable: true })
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @Column({ nullable: true, type: 'varchar', length: 50, default: null })
  rental_id: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany('Payment', 'invoice', { cascade: true })
  payments: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  calculateOutstandingAmount(): number {
    return this.total_amount - this.paid_amount;
  }

  isOverdue(): boolean {
    return (
      new Date() > new Date(this.due_date) && this.status !== InvoiceStatus.PAID
    );
  }

  updateStatus(): void {
    if (this.paid_amount >= this.total_amount) {
      this.status = InvoiceStatus.PAID;
    } else if (this.paid_amount > 0) {
      this.status = InvoiceStatus.PARTIALLY_PAID;
    } else if (this.isOverdue()) {
      this.status = InvoiceStatus.OVERDUE;
    }
    this.outstanding_amount = this.calculateOutstandingAmount();
  }
}
