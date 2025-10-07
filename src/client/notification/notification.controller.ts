import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendEmailNotification } from './dto/send-email-notification.dto';
import { SendPushNotification } from './dto/send-push-notification.dto';
import { SendBulkPushNotification } from './dto/send-bulk-push-notification.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Uncomment if you have auth

@Controller('notifications')
// @UseGuards(JwtAuthGuard) // Uncomment to protect routes
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send a custom email
   */
  @Post('email')
  async sendEmail(@Body() sendEmailDto: SendEmailNotification) {
    await this.notificationService.sendEmail(sendEmailDto);
    return { success: true, message: 'Email sent successfully' };
  }

  /**
   * Send a push notification to a single user
   */
  @Post('push')
  async sendPushNotification(@Body() sendPushDto: SendPushNotification) {
    await this.notificationService.sendPushNotification(sendPushDto);
    return { success: true, message: 'Push notification sent successfully' };
  }

  /**
   * Send a push notification to multiple users
   */
  @Post('push/bulk')
  async sendBulkPushNotification(
    @Body() bulkPushDto: SendBulkPushNotification,
  ) {
    const result =
      await this.notificationService.sendPushNotificationToMultiple(
        bulkPushDto.user_ids,
        bulkPushDto.title,
        bulkPushDto.body,
        bulkPushDto.data,
        bulkPushDto.image_url,
      );
    return {
      success: true,
      message: 'Bulk push notifications processed',
      result,
    };
  }

  /**
   * Send welcome email to a user
   */
  @Post('welcome-email')
  async sendWelcomeEmail(
    @Body() body: { email: string; name: string; userId?: string },
  ) {
    await this.notificationService.sendWelcomeEmail(
      body.email,
      body.name,
      body.userId,
    );
    return { success: true, message: 'Welcome email sent successfully' };
  }

  /**
   * Send payment received notification
   */
  @Post('payment-received')
  async sendPaymentReceived(
    @Body()
    body: {
      landlordEmail: string;
      landlordName: string;
      landlordId: string;
      tenantName: string;
      propertyAddress: string;
      amount: number;
      paymentDate: string;
    },
  ) {
    await this.notificationService.sendPaymentReceivedEmail(
      body.landlordEmail,
      body.landlordName,
      body.landlordId,
      body.tenantName,
      body.propertyAddress,
      body.amount,
      body.paymentDate,
    );
    return { success: true, message: 'Payment notification sent successfully' };
  }

  /**
   * Send rent reminder
   */
  @Post('rent-reminder')
  async sendRentReminder(
    @Body()
    body: {
      tenantEmail: string;
      tenantName: string;
      tenantId: string;
      propertyAddress: string;
      amount: number;
      dueDate: string;
    },
  ) {
    await this.notificationService.sendRentReminder(
      body.tenantEmail,
      body.tenantName,
      body.tenantId,
      body.propertyAddress,
      body.amount,
      body.dueDate,
    );
    return { success: true, message: 'Rent reminder sent successfully' };
  }

  /**
   * Send maintenance request notification
   */
  @Post('maintenance-request')
  async sendMaintenanceNotification(
    @Body()
    body: {
      landlordEmail: string;
      landlordName: string;
      landlordId: string;
      tenantName: string;
      propertyAddress: string;
      issueDescription: string;
      priority: string;
    },
  ) {
    await this.notificationService.sendMaintenanceNotification(
      body.landlordEmail,
      body.landlordName,
      body.landlordId,
      body.tenantName,
      body.propertyAddress,
      body.issueDescription,
      body.priority,
    );
    return {
      success: true,
      message: 'Maintenance notification sent successfully',
    };
  }

  /**
   * Test email configuration
   */
  @Get('test-email/:email')
  async testEmailConfig(@Param('email') email: string) {
    const result = await this.notificationService.testEmailConfiguration(email);
    return {
      success: result,
      message: result
        ? 'Email configuration is working'
        : 'Email configuration test failed',
    };
  }
}
