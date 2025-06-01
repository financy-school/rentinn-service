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
import { Payment } from './payment.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { Room } from '../../properties/entities/room.entity';

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rentAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  securityDeposit: number;

  @Column()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  outstandingAmount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  leaseDocumentUrl: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  isSecurityDepositPaid: boolean;

  @Column({ default: 1 })
  rentDueDay: number;

  @ManyToOne(() => User, (user) => user.rentalsAsTenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: User;

  @Column()
  tenantId: number;

  @ManyToOne(() => Room, (room) => room.rentals) // Use forward reference
  @JoinColumn({ name: 'roomId' }) // Corrected from 'id' to 'roomId'
  room: Room;

  @Column()
  roomId: number;

  @OneToMany(() => Payment, (payment) => payment.rental, { cascade: true })
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  calculateTotalPaid(): number {
    if (!this.payments || this.payments.length === 0) {
      return 0;
    }
    return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  isRentDue(): boolean {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const rentalStart = new Date(this.startDate);
    const rentalMonth = rentalStart.getMonth();
    const rentalYear = rentalStart.getFullYear();

    return (
      today.getDate() >= this.rentDueDay &&
      currentMonth === rentalMonth &&
      currentYear === rentalYear
    );
  }

  isExpired(): boolean {
    if (!this.endDate) {
      return false;
    }
    return new Date(this.endDate) < new Date();
  }
}
