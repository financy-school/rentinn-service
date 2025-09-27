import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
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

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getUserSettings(@Request() req: any) {
    return this.settingsService.getUserSettings(req.user.user_id);
  }

  @Get('app-info')
  getAppInfo(@Request() req: any) {
    return this.settingsService.getAppInfo(req.user.user_id);
  }

  @Patch()
  updateSettings(
    @Request() req: any,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(
      req.user.user_id,
      updateSettingsDto,
    );
  }

  @Post('reset')
  resetSettings(@Request() req: any) {
    return this.settingsService.resetToDefaults(req.user.user_id);
  }

  @Post('backup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  backupData(@Request() req: any) {
    return this.settingsService.backupUserData(req.user.user_id);
  }

  @Post('export-reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  exportReports(@Request() req: any) {
    return this.settingsService.exportReports(req.user.user_id);
  }

  @Post('clear-cache')
  clearCache(@Request() req: any) {
    return this.settingsService.clearCache(req.user.user_id);
  }

  @Post('password-changed')
  passwordChanged(@Request() req: any) {
    return this.settingsService.updatePasswordChangeDate(req.user.user_id);
  }

  // Notification-specific endpoints
  @Patch('notifications')
  updateNotifications(
    @Request() req: any,
    @Body() notifications: NotificationSettingsDto,
  ) {
    return this.settingsService.updateSettings(req.user.user_id, notifications);
  }

  // App preferences endpoints
  @Patch('preferences')
  updatePreferences(
    @Request() req: any,
    @Body() preferences: AppPreferencesDto,
  ) {
    return this.settingsService.updateSettings(
      req.user.user_id,
      preferences as any,
    );
  }

  // Privacy settings endpoints
  @Patch('privacy')
  updatePrivacySettings(
    @Request() req: any,
    @Body() privacy: PrivacySettingsDto,
  ) {
    return this.settingsService.updateSettings(req.user.user_id, privacy);
  }
}
