import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';
import { ExpensePayment } from './expense-payment.entity';

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum ExpenseRecurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum ExpensePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('expenses')
export class Expense {
  @Column({ primary: true, type: 'varchar', length: 70 })
  expense_id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  outstanding_amount: number;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status: ExpenseStatus;

  @Column({
    type: 'enum',
    enum: ExpensePriority,
    default: ExpensePriority.MEDIUM,
  })
  priority: ExpensePriority;

  @Column({ type: 'date' })
  expense_date: Date;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  payment_date: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  vendor_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  vendor_phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vendor_email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice_number: string;

  @Column({ type: 'text', nullable: true })
  invoice_url: string;

  @Column({ type: 'text', nullable: true })
  receipt_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_method: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  transaction_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ExpenseRecurrence,
    default: ExpenseRecurrence.NONE,
  })
  recurrence: ExpenseRecurrence;

  @Column({ type: 'date', nullable: true })
  next_recurrence_date: Date;

  @Column({ type: 'varchar', length: 70, nullable: true })
  parent_expense_id: string;

  @Column({ default: false })
  is_recurring: boolean;

  @Column({ default: false })
  is_approved: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  approved_by: string;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ type: 'varchar', length: 50 })
  property_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  user_id: string;

  @ManyToOne(() => ExpenseCategory)
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @Column({ type: 'varchar', length: 50 })
  category_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recorded_by: string;

  @OneToMany(() => ExpensePayment, (payment) => payment.expense, {
    cascade: true,
  })
  payments: ExpensePayment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
