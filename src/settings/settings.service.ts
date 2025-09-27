import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { User } from '../users/entities/user.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get user settings or create default if not exists
   */
  async getUserSettings(user_id: string): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { user_id },
      relations: ['user'],
    });

    if (!settings) {
      // Create default settings for new user
      settings = await this.createDefaultSettings(user_id);
    }

    return settings;
  }

  /**
   * Create default settings for a user
   */
  async createDefaultSettings(user_id: string): Promise<UserSettings> {
    const user = await this.userRepository.findOne({
      where: { user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultSettings = this.settingsRepository.create({
      user_id,
      user,
      user_setting_id: `SET-${uuidv7()}`,
      // Default values are set in the entity
    });

    return await this.settingsRepository.save(defaultSettings);
  }

  /**
   * Update user settings
   */
  async updateSettings(
    user_id: string,
    updateSettingsDto: UpdateSettingsDto,
  ): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { user_id },
    });

    if (!settings) {
      // Create settings if they don't exist
      settings = await this.createDefaultSettings(user_id);
    }

    // Update settings
    Object.assign(settings, updateSettingsDto);

    return await this.settingsRepository.save(settings);
  }

  /**
   * Reset settings to default
   */
  async resetToDefaults(user_id: string): Promise<UserSettings> {
    await this.settingsRepository.delete({ user_id });
    return await this.createDefaultSettings(user_id);
  }

  /**
   * Backup user data (placeholder for actual backup logic)
   */
  async backupUserData(
    user_id: string,
  ): Promise<{ message: string; backupId: string }> {
    const settings = await this.settingsRepository.findOne({
      where: { user_id },
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    // Update last backup date
    settings.lastBackupDate = new Date();
    await this.settingsRepository.save(settings);

    // Placeholder for actual backup logic
    const backupId = `backup_${user_id}_${Date.now()}`;

    return {
      message: 'Data backup initiated successfully',
      backupId,
    };
  }

  /**
   * Export reports (placeholder for actual export logic)
   */
  async exportReports(
    userId: number,
  ): Promise<{ message: string; reportUrl: string }> {
    // Placeholder for actual export logic
    const reportId = `report_${userId}_${Date.now()}`;
    const reportUrl = `https://api.example.com/reports/${reportId}.pdf`;

    return {
      message: 'Report export initiated successfully',
      reportUrl,
    };
  }

  /**
   * Clear cache for user
   */
  async clearCache(user_id: string): Promise<{ message: string }> {
    const settings = await this.settingsRepository.findOne({
      where: { user_id },
    });

    if (settings) {
      settings.lastCacheCleared = new Date();
      await this.settingsRepository.save(settings);
    }

    // Placeholder for actual cache clearing logic
    return {
      message: 'Cache cleared successfully',
    };
  }

  /**
   * Change password (delegates to auth service in real implementation)
   */
  async updatePasswordChangeDate(user_id: string): Promise<void> {
    const settings = await this.getUserSettings(user_id);
    settings.lastPasswordChange = new Date();
    await this.settingsRepository.save(settings);
  }

  /**
   * Update login tracking
   */
  async updateLoginTracking(
    user_id: string,
    successful: boolean,
  ): Promise<void> {
    const settings = await this.getUserSettings(user_id);

    if (successful) {
      settings.lastLoginDate = new Date();
      settings.loginAttempts = 0;
    } else {
      settings.loginAttempts += 1;
    }

    await this.settingsRepository.save(settings);
  }

  /**
   * Get app info and statistics
   */
  async getAppInfo(user_id: string): Promise<any> {
    const settings = await this.getUserSettings(user_id);

    return {
      appVersion: settings.appVersion || 'v1.0.0 (Build 1)',
      lastBackupDate: settings.lastBackupDate,
      lastCacheCleared: settings.lastCacheCleared,
      lastPasswordChange: settings.lastPasswordChange,
      lastLoginDate: settings.lastLoginDate,
      loginAttempts: settings.loginAttempts,
      settings: {
        darkMode: settings.darkMode,
        language: settings.language,
        currency: settings.currency,
        notifications: {
          push: settings.pushNotifications,
          email: settings.emailNotifications,
          sms: settings.smsAlerts,
          maintenance: settings.maintenanceAlerts,
          payments: settings.paymentUpdates,
        },
        privacy: {
          analytics: settings.analyticsEnabled,
          twoFactor: settings.twoFactorEnabled,
        },
        dataManagement: {
          autoBackup: settings.autoBackup,
          autoExportReports: settings.autoExportReports,
        },
      },
    };
  }
}
