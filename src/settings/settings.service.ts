import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { User } from '../users/entities/user.entity';

import { UpdateSettingsDto } from './dto/update-settings.dto';

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
  async getUserSettings(userId: number): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!settings) {
      // Create default settings for new user
      settings = await this.createDefaultSettings(userId);
    }

    return settings;
  }

  /**
   * Create default settings for a user
   */
  async createDefaultSettings(userId: number): Promise<UserSettings> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const defaultSettings = this.settingsRepository.create({
      userId,
      user,
      // Default values are set in the entity
    });

    return await this.settingsRepository.save(defaultSettings);
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: number,
    updateSettingsDto: UpdateSettingsDto,
  ): Promise<UserSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create settings if they don't exist
      settings = await this.createDefaultSettings(userId);
    }

    // Update settings
    Object.assign(settings, updateSettingsDto);

    return await this.settingsRepository.save(settings);
  }

  /**
   * Reset settings to default
   */
  async resetToDefaults(userId: number): Promise<UserSettings> {
    await this.settingsRepository.delete({ userId });
    return await this.createDefaultSettings(userId);
  }

  /**
   * Backup user data (placeholder for actual backup logic)
   */
  async backupUserData(
    userId: number,
  ): Promise<{ message: string; backupId: string }> {
    const settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    // Update last backup date
    settings.lastBackupDate = new Date();
    await this.settingsRepository.save(settings);

    // Placeholder for actual backup logic
    const backupId = `backup_${userId}_${Date.now()}`;

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
  async clearCache(userId: number): Promise<{ message: string }> {
    const settings = await this.settingsRepository.findOne({
      where: { userId },
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
  async updatePasswordChangeDate(userId: number): Promise<void> {
    const settings = await this.getUserSettings(userId);
    settings.lastPasswordChange = new Date();
    await this.settingsRepository.save(settings);
  }

  /**
   * Update login tracking
   */
  async updateLoginTracking(
    userId: number,
    successful: boolean,
  ): Promise<void> {
    const settings = await this.getUserSettings(userId);

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
  async getAppInfo(userId: number): Promise<any> {
    const settings = await this.getUserSettings(userId);

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
