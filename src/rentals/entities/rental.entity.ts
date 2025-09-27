import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { Room } from '../../properties/entities/room.entity';
import { Invoice } from '../../finance/entities/invoice.entity';
import { Tenant } from '../../entities';

@Entity('rentals')
export class Rental {
  @Column({ unique: true, length: 70, type: 'varchar', primary: true })
  rental_id: string;

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

  @ManyToOne(() => Tenant, (tenant) => tenant.tenant_id)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @ManyToOne(() => Room, (room) => room.rentals)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ type: 'varchar', length: 50 })
  roomId: string;

  @Column({ default: null, nullable: true })
  property_id: string;

  @OneToMany(() => Payment, (payment) => payment.rental, { cascade: true })
  payments: Payment[];

  @OneToMany(() => Invoice, (invoice) => invoice.rental)
  invoices: Invoice[];

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
