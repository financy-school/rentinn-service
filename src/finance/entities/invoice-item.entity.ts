import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export enum BillCategory {
  RENT = 'RENT',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT',
  JOINING_FEE = 'JOINING_FEE',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  MAINTENANCE = 'MAINTENANCE',
  INTERNET = 'INTERNET',
  LATE_FEE = 'LATE_FEE',
  OTHER = 'OTHER',
}

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: BillCategory })
  category: BillCategory;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  existingDues: number;

  @Column({ nullable: true })
  existingDueDate: Date;

  @Column()
  dueDate: Date;

  @Column({ default: false })
  isFixed: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedAmount: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // For storing additional data like meter readings

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  invoiceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  getTotalAmount(): number {
    return this.amount * this.quantity;
  }

  getTotalWithExistingDues(): number {
    return this.getTotalAmount() + this.existingDues;
  }
}
