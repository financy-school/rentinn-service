import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  outstandingAmount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  issueDate: Date;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringFrequency: string; // 'MONTHLY', 'QUARTERLY', 'YEARLY'

  @Column({ nullable: true })
  nextRecurringDate: Date;

  @Column({ default: false })
  sendReminder: boolean;

  @Column({ nullable: true })
  lastReminderSent: Date;

  // Relationships
  @ManyToOne(() => Tenant, { eager: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string; // Changed to string to match Tenant's UUID

  @ManyToOne(() => User, (user) => user.invoicesAsLandlord)
  @JoinColumn({ name: 'landlordId' })
  landlord: User;

  @Column()
  landlordId: number;

  @ManyToOne(() => Rental, (rental) => rental.invoices, { nullable: true })
  @JoinColumn({ name: 'rentalId' })
  rental: Rental;

  @Column({ nullable: true })
  rentalId: number;

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
    return this.totalAmount - this.paidAmount;
  }

  isOverdue(): boolean {
    return (
      new Date() > new Date(this.dueDate) && this.status !== InvoiceStatus.PAID
    );
  }

  updateStatus(): void {
    if (this.paidAmount >= this.totalAmount) {
      this.status = InvoiceStatus.PAID;
    } else if (this.paidAmount > 0) {
      this.status = InvoiceStatus.PARTIALLY_PAID;
    } else if (this.isOverdue()) {
      this.status = InvoiceStatus.OVERDUE;
    }
    this.outstandingAmount = this.calculateOutstandingAmount();
  }

  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }
}
