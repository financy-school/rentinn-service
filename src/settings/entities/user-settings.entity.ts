import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Language {
  ENGLISH = 'ENGLISH',
  HINDI = 'HINDI',
  SPANISH = 'SPANISH',
  FRENCH = 'FRENCH',
}

export enum Currency {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

@Entity('user_settings')
export class UserSettings {
  @Column({ primary: true, length: 70, type: 'varchar' })
  user_setting_id: string;

  // Notification Settings
  @Column({ default: true })
  pushNotifications: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: false })
  smsAlerts: boolean;

  @Column({ default: true })
  maintenanceAlerts: boolean;

  @Column({ default: null, nullable: true })
  property_id: string;

  @Column({ default: true })
  paymentUpdates: boolean;

  // App Preferences
  @Column({ default: false })
  darkMode: boolean;

  @Column({ type: 'enum', enum: Language, default: Language.ENGLISH })
  language: Language;

  @Column({ type: 'enum', enum: Currency, default: Currency.INR })
  currency: Currency;

  @Column({ default: true })
  autoBackup: boolean;

  // Privacy & Security
  @Column({ default: true })
  analyticsEnabled: boolean;

  @Column({ nullable: true })
  lastPasswordChange: Date;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  // Data Management
  @Column({ nullable: true })
  lastBackupDate: Date;

  @Column({ default: true })
  autoExportReports: boolean;

  @Column({ nullable: true })
  lastCacheCleared: Date;

  // App Metadata
  @Column({ nullable: true })
  appVersion: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  lastLoginDate: Date;

  // User relationship
  @ManyToOne(() => User, (user) => user.settings)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 70, type: 'varchar' })
  user_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
