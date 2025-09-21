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

  @ManyToOne('Invoice', 'payments', { nullable: true })
  @JoinColumn({ name: 'invoiceId' })
  invoice: any;

  @Column({ nullable: true })
  invoiceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
