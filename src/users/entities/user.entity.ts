import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { Property } from '../../properties/entities/property.entity';
import { Invoice } from '../../finance/entities/invoice.entity';
import { UserSettings } from '../../entities';

@Entity('users')
export class User {
  @Column({ primary: true, type: 'varchar', length: 70 })
  user_id: string;

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

  @OneToMany(() => Invoice, (invoice) => invoice.user_id)
  invoicesAsLandlord: Invoice[];

  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
