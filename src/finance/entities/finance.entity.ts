import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Property } from '../../properties/entities/property.entity';

@Entity('finance')
export class Finance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.tenant_id)
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255, nullable: false })
  property_id: string;

  @ManyToOne(() => Property, (property) => property.property_id, {
    nullable: false,
  })
  property: Property;

  @Column({ type: 'varchar', length: 100, nullable: false })
  transaction_type: string; // Rent, Electricity, Maintenance

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;

  @Column({ type: 'timestamp', nullable: false })
  due_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  payment_date: Date;

  @CreateDateColumn()
  created_at: Date;
}
