import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Room } from '../../properties/entities/room.entity';

@Entity('tenant')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 15, nullable: false })
  phone_number: string;

  @Column({ type: 'varchar', length: 15, nullable: true, default: null })
  alternate_phone: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  tenant_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  agreement_period: string;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  lock_in_period: string;

  @Column({ type: 'date', nullable: true, default: null })
  add_rent_on: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  id_proof_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  id_proof_number: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  property_id: number;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_on_notice: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  rent_amount: number;

  @Column({ type: 'boolean', default: false })
  has_dues: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  due_amount: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @ManyToOne(() => Room, (room) => room.id, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  room: Room;

  @Column({ type: 'date', nullable: false })
  check_in_date: Date;

  @Column('simple-array', { nullable: true })
  image_id_list: string[];

  @Column({ type: 'date', nullable: true })
  check_out_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany('Invoice', 'tenant')
  invoices: any[];
}
