import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('rooms')
export class Room {
  @Column({ primary: true, type: 'varchar', length: 36 })
  room_id: string;

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

  @Column({ default: 0, nullable: false, type: 'int' })
  available_count: number;

  @Column({ default: false })
  furnished: boolean;

  @Column({ nullable: true })
  amenities: string;

  @Column('simple-array', { nullable: true })
  image_document_id_list: string[];

  @ManyToOne(() => Property, (property) => property.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  property_id: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  user_id: string;

  @OneToMany(() => Rental, (rental) => rental.room)
  rentals: Rental[];

  @OneToMany(() => Ticket, (ticket) => ticket.room)
  tickets: Ticket[];

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
