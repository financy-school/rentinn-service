import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  id_proof_type: string; // e.g., Aadhar, Passport

  @Column({ type: 'varchar', length: 50, nullable: false })
  id_proof_number: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Room, (room) => room.id, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  room: Room;

  @Column({ type: 'date', nullable: false })
  check_in_date: Date;

  @Column({ type: 'date', nullable: true })
  check_out_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
