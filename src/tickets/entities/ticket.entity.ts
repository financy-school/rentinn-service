import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column()
  propertyId: number;

  @Column()
  roomId: number;

  @Column()
  status: string;

  @Column()
  raisedBy: string;

  @Column()
  issue: string;

  @Column('text')
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('simple-array', { nullable: true, default: null })
  image_document_id_list: string[];
}
