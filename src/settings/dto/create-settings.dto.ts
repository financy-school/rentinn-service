import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language, Currency } from '../entities/user-settings.entity';

export class CreateSettingsDto {
  // Notification Settings
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean = true;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean = true;

  @IsOptional()
  @IsBoolean()
  smsAlerts?: boolean = false;

  @IsOptional()
  @IsBoolean()
  maintenanceAlerts?: boolean = true;

  @IsOptional()
  @IsBoolean()
  paymentUpdates?: boolean = true;

  // App Preferences
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean = false;

  @IsOptional()
  @IsEnum(Language)
  language?: Language = Language.ENGLISH;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.INR;

  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean = true;

  // Privacy & Security
  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean = true;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean = false;

  // Data Management
  @IsOptional()
  @IsBoolean()
  autoExportReports?: boolean = true;

  // App Metadata
  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
