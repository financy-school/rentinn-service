import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Property } from '../../property/entities/property.entity';

@Entity('room')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Property, (property) => property.rooms, {
    onDelete: 'CASCADE',
  })
  property: Property;

  @Column({ type: 'varchar', length: 255, nullable: false })
  room_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  unit_type: string;

  @Column({ type: 'int', nullable: false })
  floor: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  sharing_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  rent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  daily_stay_min: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  daily_stay_max: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  area_sqft: number;

  @Column({ type: 'boolean', default: true })
  is_available_for_rent: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'json', nullable: true })
  room_facilities: any;

  @Column({ type: 'varchar', length: 100, nullable: false })
  room_type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  electricity_reading: number;

  @Column({ type: 'timestamp', nullable: true })
  electricity_date: Date;

  @Column({ type: 'json', nullable: true })
  room_images: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
