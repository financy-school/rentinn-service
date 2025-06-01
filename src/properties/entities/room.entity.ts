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

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  area: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rentAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  securityDeposit: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  floorNumber: number;

  @Column({ nullable: true })
  bedroomCount: number;

  @Column({ nullable: true })
  bathroomCount: number;

  @Column({ default: false })
  isFurnished: boolean;

  @Column({ nullable: true })
  amenities: string;

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
