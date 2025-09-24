import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Language, Currency } from '../entities/user-settings.entity';

export class UpdateSettingsDto {
  // Notification Settings
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentUpdates?: boolean;

  // App Preferences
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;

  // Privacy & Security
  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  // Data Management
  @IsOptional()
  @IsBoolean()
  autoExportReports?: boolean;

  // App Metadata
  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
