import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationSettingsDto {
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
}

export class AppPreferencesDto {
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @IsOptional()
  language?: string;

  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean;
}

export class PrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}
