import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationService } from '../client/notification/notification.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private settingsService: SettingsService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      ...registerDto,
      role: UserRole.LANDLORD,
    });

    // Create default settings for the new user
    await this.settingsService.createDefaultSettings(user.user_id);

    // Send welcome email
    try {
      await this.notificationService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    }

    const payload = {
      email: user.email,
      sub: user.user_id,
      role: UserRole.LANDLORD,
    };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (user && (await this.comparePasswords(password, user.password))) {
        const { ...result } = user;
        return result;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Login user and generate JWT token
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Track failed login attempt if user exists
      const existingUser = await this.usersService.findByEmail(loginDto.email);
      if (existingUser) {
        await this.settingsService.updateLoginTracking(
          existingUser.user_id,
          false,
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Track successful login
    await this.settingsService.updateLoginTracking(user.user_id, true);

    const payload = {
      email: user.email,
      sub: user.user_id,
      role: user.role,
    };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Utility method to compare passwords
   */
  private async comparePasswords(
    plainText: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashedPassword);
  }
}
