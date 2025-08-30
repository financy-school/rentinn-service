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
import { Property } from './property.entity';
import { Rental } from '../../rentals/entities/rental.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string;

  @Column({ type: 'varchar', length: 200, default: null, nullable: true })
  areaType: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rentAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  securityAmount: number;

  @Column({ default: true })
  available: boolean;

  @Column({ nullable: true })
  floorNumber: number;

  @Column({ nullable: true, default: 0 })
  bedCount: number;

  @Column({ type: 'varchar', length: 200, default: null, nullable: true })
  status: string;

  @Column({ nullable: true, default: 0 })
  bathroomCount: number;

  @Column({ default: false })
  furnished: boolean;

  @Column({ nullable: true })
  amenities: string;

  @Column('simple-array', { nullable: true })
  image_document_id_list: string[];

  @ManyToOne(() => Property, (property) => property.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  propertyId: number;

  @OneToMany(() => Rental, (rental) => rental.room) // Use forward reference
  rentals: Rental[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'date', nullable: true })
  lastElectricityReadingDate: Date;

  @Column({ type: 'int', default: 0, nullable: true })
  lastElectricityReading: number;

  get isOccupied(): boolean {
    if (!this.rentals) {
      return false;
    }
    return this.rentals.some(
      (rental) =>
        rental.isActive &&
        (!rental.endDate || new Date(rental.endDate) > new Date()),
    );
  }
}
