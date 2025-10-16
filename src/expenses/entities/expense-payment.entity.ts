import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Expense } from './expense.entity';

@Entity('expense_payments')
export class ExpensePayment {
  @Column({ primary: true, type: 'varchar', length: 70 })
  payment_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  payment_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_method: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  transaction_id: string;

  @Column({ type: 'text', nullable: true })
  receipt_url: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recorded_by: string;

  @ManyToOne(() => Expense, (expense) => expense.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @Column({ type: 'varchar', length: 70 })
  expense_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
