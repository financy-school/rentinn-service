import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import {
  NotificationSettingsDto,
  AppPreferencesDto,
  PrivacySettingsDto,
} from './dto/settings-categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getUserSettings(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.getUserSettings(user_id);
  }

  @Get('app-info')
  getAppInfo(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.getAppInfo(user_id);
  }

  @Patch()
  updateSettings(
    @CurrentUser('user_id') user_id: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user_id, updateSettingsDto);
  }

  @Post('reset')
  resetSettings(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.resetToDefaults(user_id);
  }

  @Post('backup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  backupData(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.backupUserData(user_id);
  }

  @Post('export-reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  exportReports(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.exportReports(user_id);
  }

  @Post('clear-cache')
  clearCache(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.clearCache(user_id);
  }

  @Post('password-changed')
  passwordChanged(@CurrentUser('user_id') user_id: string) {
    return this.settingsService.updatePasswordChangeDate(user_id);
  }

  // Notification-specific endpoints
  @Patch('notifications')
  updateNotifications(
    @CurrentUser('user_id') user_id: string,
    @Body() notifications: NotificationSettingsDto,
  ) {
    return this.settingsService.updateSettings(user_id, notifications);
  }

  // App preferences endpoints
  @Patch('preferences')
  updatePreferences(
    @CurrentUser('user_id') user_id: string,
    @Body() preferences: AppPreferencesDto,
  ) {
    return this.settingsService.updateSettings(user_id, preferences as any);
  }

  // Privacy settings endpoints
  @Patch('privacy')
  updatePrivacySettings(
    @CurrentUser('user_id') user_id: string,
    @Body() privacy: PrivacySettingsDto,
  ) {
    return this.settingsService.updateSettings(user_id, privacy);
  }
}
