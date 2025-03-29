import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('property')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  property_name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  owner_name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  owner_address: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  owner_password: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  owner_email: string;

  @Column({ type: 'varchar', length: 15, nullable: false })
  owner_phone_number: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  property_code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Room, (room) => room.property)
  rooms: Room[];

  @OneToMany(() => Tenant, (tenant) => tenant.property)
  tenants: Tenant[];
}
