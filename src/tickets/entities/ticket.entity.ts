import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Ticket {
  @PrimaryColumn({ type: 'varchar', length: 255, primary: true })
  ticket_id: string;

  @Column({ default: null, nullable: true })
  property_id: string;

  @Column({ default: null, nullable: true, type: 'varchar', length: 255 })
  room_id: string;

  @Column({ default: null, nullable: true, type: 'varchar', length: 255 })
  user_id: string;

  @Column({ default: null, nullable: true, type: 'varchar', length: 255 })
  status: string;

  @Column({ default: null, nullable: true, type: 'varchar', length: 255 })
  raisedBy: string;

  @Column({ default: null, nullable: true, type: 'varchar', length: 255 })
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
