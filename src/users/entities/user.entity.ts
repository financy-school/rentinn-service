import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { Property } from '../../properties/entities/property.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { Kyc } from '../../kyc/entities/kyc.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Property, (property) => property.owner)
  properties: Property[];

  @OneToMany(() => Rental, (rental) => rental.tenant)
  rentalsAsTenant: Rental[];

  @OneToMany('Invoice', 'tenant')
  invoicesAsTenant: any[];

  @OneToMany('Invoice', 'landlord')
  invoicesAsLandlord: any[];

  @OneToMany(() => Kyc, (kyc) => kyc.user)
  kycDocuments: Kyc[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
