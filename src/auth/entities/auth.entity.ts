import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

@Entity('auth')
export class AuthEntity {
  @PrimaryColumn({ type: 'varchar', length: 200 })
  auth_id: string;

  @Index('session_id_indx')
  @Column({ type: 'varchar', length: 200 })
  session_id: string;

  @Column({ type: 'varchar', length: 200 })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  phone_number: string;

  @Column({ type: 'varchar', length: 200 })
  school_id: string;

  @Column({ type: 'varchar', length: 200 })
  access_token: string;

  @Column({ type: 'varchar', length: 200 })
  refresh_token: string;

  @Column({ type: 'timestamp', precision: 6, default: null })
  access_token_expire_at: Date;

  @Column({ type: 'timestamp', precision: 6, default: null })
  refresh_token_expire_at: Date;

  @Column({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)(6)',
  })
  created_at: Date;

  @Column({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)(6)',
  })
  updated_at: Date;

  @Column({
    type: 'timestamp',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)(6)',
  })
  deleted_at: Date;

  @Column({ type: 'boolean', default: 1 })
  is_active: boolean;

  @Column({ type: 'boolean', default: 0 })
  is_deleted: boolean;

  @Column({ type: 'boolean', default: 1 })
  is_otp_required: boolean;

  @Column({ type: 'varchar', length: 10, default: null })
  otp: string;

  @Column({ type: 'boolean', default: 0 })
  is_otp_verified: boolean;

  @Column({ type: 'timestamp', precision: 6, default: null })
  otp_expires_at: Date;

  @Column({ type: 'int', default: 0 })
  otp_attempt_count: number;

  @Column({ type: 'timestamp', precision: 6, default: null })
  otp_last_attempt_at: Date;

  @Column({ type: 'int', default: 0 })
  otp_sent_count: number;

  @Column({ type: 'timestamp', precision: 6, default: null })
  otp_last_sent_at: Date;

  @Column({ type: 'boolean', default: false })
  is_otp_sent_on_email: boolean;

  @Column({ type: 'boolean', default: false })
  is_otp_sent_on_mobile: boolean;
}
