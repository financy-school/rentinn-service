import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from './room.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalArea: number;

  @Column({ nullable: true })
  yearBuilt: number;

  @Column({ nullable: true })
  propertyType: string;

  @Column({ default: false })
  isParkingAvailable: boolean;

  @Column({ default: false })
  isElevatorAvailable: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  propertyTaxId: string;

  @Column({ nullable: true })
  insuranceDetails: string;

  @ManyToOne(() => User, user => user.properties)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: number;

  @OneToMany(() => Room, room => room.property, { cascade: true })
  rooms: Room[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  // Convenience method to calculate total property value
  calculateTotalValue(): number {
    if (!this.rooms || this.rooms.length === 0) {
      return 0;
    }
    return this.rooms.reduce((sum, room) => sum + room.rentAmount, 0);
  }
}
