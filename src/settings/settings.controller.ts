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
    return this.settingsService.getUserSettings(req.user.id);
  }

  @Get('app-info')
  getAppInfo(@Request() req: any) {
    return this.settingsService.getAppInfo(req.user.id);
  }

  @Patch()
  updateSettings(
    @Request() req: any,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(req.user.id, updateSettingsDto);
  }

  @Post('reset')
  resetSettings(@Request() req: any) {
    return this.settingsService.resetToDefaults(req.user.id);
  }

  @Post('backup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  backupData(@Request() req: any) {
    return this.settingsService.backupUserData(req.user.id);
  }

  @Post('export-reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  exportReports(@Request() req: any) {
    return this.settingsService.exportReports(req.user.id);
  }

  @Post('clear-cache')
  clearCache(@Request() req: any) {
    return this.settingsService.clearCache(req.user.id);
  }

  @Post('password-changed')
  passwordChanged(@Request() req: any) {
    return this.settingsService.updatePasswordChangeDate(req.user.id);
  }

  // Notification-specific endpoints
  @Patch('notifications')
  updateNotifications(
    @Request() req: any,
    @Body() notifications: NotificationSettingsDto,
  ) {
    return this.settingsService.updateSettings(req.user.id, notifications);
  }

  // App preferences endpoints
  @Patch('preferences')
  updatePreferences(
    @Request() req: any,
    @Body() preferences: AppPreferencesDto,
  ) {
    return this.settingsService.updateSettings(req.user.id, preferences as any);
  }

  // Privacy settings endpoints
  @Patch('privacy')
  updatePrivacySettings(
    @Request() req: any,
    @Body() privacy: PrivacySettingsDto,
  ) {
    return this.settingsService.updateSettings(req.user.id, privacy);
  }
}
