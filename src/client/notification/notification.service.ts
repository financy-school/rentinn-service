import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { SendEmailNotification } from './dto/send-email-notification.dto';
import { SendPushNotification } from './dto/send-push-notification.dto';
import { User } from '../../entities';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter: nodemailer.Transporter;
  private firebaseApp: admin.app.App;

  private readonly defaultSenderEmail: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.defaultSenderEmail =
      this.config.get('EMAIL_FROM') || 'noreply@rentinn.com';
    this.frontendUrl = this.config.get('FRONTEND_URL') || 'https://rentinn.com';

    this.initializeEmailTransporter();
    this.initializeFirebase();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeEmailTransporter(): void {
    try {
      const smtpPort = parseInt(this.config.get('SMTP_PORT') || '587');
      // Port 465 requires secure: true, port 587 requires secure: false (uses STARTTLS)
      const isSecure = smtpPort === 465;

      this.emailTransporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST') || 'smtp.gmail.com',
        port: smtpPort,
        secure: isSecure, // true for 465, false for other ports (587 uses STARTTLS)
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
        // Enable STARTTLS for port 587
        ...(smtpPort === 587 && {
          requireTLS: true,
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false, // Use true in production with valid certificates
          },
        }),
        pool: true, // Use pooled connections
        maxConnections: 5,
        maxMessages: 100,
      });

      // Verify transporter configuration
      this.emailTransporter.verify((error) => {
        if (error) {
          this.logger.error('Email transporter verification failed:', error);
        } else {
          this.logger.log('Email transporter is ready');
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.app();
        this.logger.log('Firebase Admin SDK already initialized');
        return;
      }

      // Try to get service account from path or JSON string
      const serviceAccountPath = this.config.get(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
      );
      const serviceAccountJson = this.config.get(
        'FIREBASE_SERVICE_ACCOUNT_JSON',
      );

      this.logger.log(
        `Config check - Path: ${serviceAccountPath ? 'SET' : 'NOT SET'}, JSON: ${serviceAccountJson ? 'SET' : 'NOT SET'}`,
      );

      let credential: admin.credential.Credential;

      if (serviceAccountJson) {
        // Parse JSON string directly (useful for environment variables)
        this.logger.log('Loading Firebase from JSON string...');
        const serviceAccount = JSON.parse(serviceAccountJson);
        credential = admin.credential.cert(serviceAccount);
        this.logger.log(
          `Firebase initialized with JSON configuration for project: ${serviceAccount.project_id}`,
        );
      } else if (serviceAccountPath) {
        // Load from file path
        const absolutePath = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.join(process.cwd(), serviceAccountPath);

        this.logger.log(`Loading Firebase from file: ${absolutePath}`);

        if (!fs.existsSync(absolutePath)) {
          this.logger.error(`File not found at: ${absolutePath}`);
          this.logger.error(`Current working directory: ${process.cwd()}`);
          this.logger.error(
            `Checking if file exists: ${fs.existsSync(absolutePath)}`,
          );
          throw new Error(
            `Firebase service account file not found at: ${absolutePath}`,
          );
        }

        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        credential = admin.credential.cert(serviceAccount);
        this.logger.log(
          `Firebase initialized with service account file for project: ${serviceAccount.project_id}`,
        );
      } else {
        this.logger.warn(
          'Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON',
        );
        return;
      }

      this.firebaseApp = admin.initializeApp({
        credential,
      });

      this.logger.log(
        '🎉 Firebase Admin SDK initialized successfully and ready to send push notifications!',
      );
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase:', error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      this.logger.error(
        'Make sure your Firebase service account JSON is valid',
      );
    }
  }

  /**
   * Send email using nodemailer
   */
  async sendEmail(
    sendEmailNotification: SendEmailNotification,
  ): Promise<boolean> {
    const {
      sender_address,
      to_address,
      cc_address,
      bcc_address,
      subject,
      html_content,
      text_content,
      attachments,
    } = sendEmailNotification;

    try {
      this.logger.log('📧 Preparing to send email...');
      this.logger.log(`To: ${to_address}`);
      this.logger.log(`Subject: ${subject}`);

      if (!this.emailTransporter) {
        this.logger.error('❌ Email transporter not initialized!');
        throw new Error('Email transporter not initialized');
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: sender_address || this.defaultSenderEmail,
        to: to_address,
        subject: subject,
      };

      // Add optional fields
      if (cc_address) mailOptions.cc = cc_address;
      if (bcc_address) mailOptions.bcc = bcc_address;
      if (html_content) mailOptions.html = html_content;
      if (text_content) mailOptions.text = text_content;
      if (attachments) mailOptions.attachments = attachments.flat();

      this.logger.log('📤 Sending email via SMTP...');
      const info = await this.emailTransporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to send email:', error);
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Send push notification via Firebase FCM
   */
  async sendPushNotification(
    notification: SendPushNotification,
  ): Promise<boolean> {
    const { user_id, title, body, data, image_url } = notification;

    try {
      // Get user's FCM token
      const user = await this.userRepository.findOne({
        where: { user_id: user_id },
      });

      if (!user || !user.firebaseToken) {
        this.logger.warn(`No Firebase token found for user ${user_id}`);
        return false;
      }

      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
          ...(image_url && { imageUrl: image_url }),
        },
        data: data || {},
        token: user.firebaseToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);

      // Handle invalid Firebase token
      if (
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as any).code === 'messaging/invalid-registration-token') ||
        (error as any).code === 'messaging/registration-token-not-registered'
      ) {
        await this.clearInvalidFcmToken(notification.user_id);
      }

      throw error;
    }
  }

  /**
   * Send push notifications to multiple users
   */
  async sendPushNotificationToMultiple(
    user_ids: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    image_url?: string,
  ): Promise<{ success: number; failure: number }> {
    try {
      const users = await this.userRepository.findBy({ user_id: In(user_ids) });
      const tokens = users
        .filter((u) => u.firebaseToken)
        .map((u) => u.firebaseToken);

      if (tokens.length === 0) {
        this.logger.warn(
          'No valid Firebase tokens found for the provided user IDs',
        );
        return { success: 0, failure: 0 };
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
          ...(image_url && { imageUrl: image_url }),
        },
        data: data || {},
        tokens,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      let successCount = 0;
      let failureCount = 0;

      for (let idx = 0; idx < tokens.length; idx++) {
        const token = tokens[idx];
        try {
          await admin.messaging().send({
            ...message,
            token,
          });
          successCount++;
        } catch (err) {
          failureCount++;
          const user = users.find((u) => u.firebaseToken === token);
          if (user) {
            this.clearInvalidFcmToken(user.user_id);
          }
        }
      }

      this.logger.log(
        `Push notifications sent: ${successCount} successful, ${failureCount} failed`,
      );

      return {
        success: successCount,
        failure: failureCount,
      };
    } catch (error) {
      this.logger.error(
        'Failed to send push notifications to multiple users:',
        error,
      );
      throw error;
    }
  }

  /**
   * Clear invalid FCM token from user record
   */
  private async clearInvalidFcmToken(userId: string): Promise<void> {
    try {
      await this.userRepository.update(
        { user_id: userId },
        { firebaseToken: null },
      );
      this.logger.log(`Cleared invalid FCM token for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear FCM token for user ${userId}:`, error);
    }
  }

  /**
   * Load email template from file
   */
  private loadEmailTemplate(templateName: string): string {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'client',
      'notification',
      'templates',
      `${templateName}.html`,
    );

    try {
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(`Error reading template ${templateName}:`, error);
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  /**
   * Replace template variables
   */
  private replaceTemplateVariables(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    userId?: string,
  ): Promise<void> {
    try {
      const template = this.loadEmailTemplate('welcome-email');
      const customizedTemplate = this.replaceTemplateVariables(template, {
        name: userName,
        email: userEmail,
        loginUrl: `${this.frontendUrl}/login`,
        websiteUrl: this.frontendUrl,
        privacyUrl: `${this.frontendUrl}/privacy`,
        termsUrl: `${this.frontendUrl}/terms`,
      });

      await this.sendEmail({
        to_address: userEmail,
        subject:
          'Welcome to RentInn - Your Property Management Journey Begins!',
        html_content: customizedTemplate,
      });

      // Send push notification if user has FCM token
      if (userId) {
        await this.sendPushNotification({
          user_id: userId,
          title: 'Welcome to RentInn! 🎉',
          body: `Hi ${userName}, welcome aboard! Start managing your properties today.`,
          data: { type: 'welcome', screen: 'dashboard' },
        });
      }
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Send payment received email to landlord
   */
  async sendPaymentReceivedEmail(
    landlordEmail: string,
    landlordName: string,
    landlordId: string,
    tenantName: string,
    propertyAddress: string,
    amount: number,
    paymentDate: string,
  ): Promise<void> {
    this.logger.log('💰 sendPaymentReceivedEmail called');
    this.logger.log(`Landlord email: ${landlordEmail}`);
    this.logger.log(`Landlord name: ${landlordName}`);
    this.logger.log(`Tenant name: ${tenantName}`);
    this.logger.log(`Property: ${propertyAddress}`);
    this.logger.log(`Amount: $${amount}`);
    this.logger.log(`Payment date: ${paymentDate}`);

    try {
      this.logger.log('📄 Loading email template...');
      const template = this.loadEmailTemplate('payment-received-email');

      this.logger.log('🔧 Customizing template with variables...');
      const customizedTemplate = this.replaceTemplateVariables(template, {
        landlordName,
        tenantName,
        propertyAddress,
        amount: amount.toFixed(2),
        paymentDate,
        dashboardUrl: `${this.frontendUrl}/dashboard`,
        websiteUrl: this.frontendUrl,
      });

      this.logger.log('📧 Calling sendEmail...');
      await this.sendEmail({
        to_address: landlordEmail,
        subject: `Payment Received - $${amount.toFixed(2)} from ${tenantName}`,
        html_content: customizedTemplate,
      });

      this.logger.log('✅ Payment received email sent successfully.');

      // Send push notification
      if (landlordId) {
        this.logger.log('📱 Sending payment received push notification...');
        try {
          await this.sendPushNotification({
            user_id: landlordId,
            title: 'Payment Received! 💰',
            body: `${tenantName} paid $${amount.toFixed(2)} for ${propertyAddress}`,
            data: {
              type: 'payment_received',
              amount: amount.toString(),
              tenant: tenantName,
              screen: 'payment_details',
            },
          });
          this.logger.log('✅ Push notification sent successfully.');
        } catch (pushError) {
          this.logger.warn('⚠️ Failed to send push notification:', pushError);
        }
      }
    } catch (error) {
      this.logger.error('❌ Failed to send payment received email:', error);
      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      }
      throw error;
    }
  }

  /**
   * Send rent reminder email and push notification
   */
  async sendRentReminder(
    tenantEmail: string,
    tenantName: string,
    tenantId: string,
    propertyAddress: string,
    amount: number,
    dueDate: string,
  ): Promise<void> {
    try {
      const template = this.loadEmailTemplate('rent-reminder-email');
      const customizedTemplate = this.replaceTemplateVariables(template, {
        tenantName,
        propertyAddress,
        amount: amount.toFixed(2),
        dueDate,
        paymentUrl: `${this.frontendUrl}/payments`,
        websiteUrl: this.frontendUrl,
      });

      await this.sendEmail({
        to_address: tenantEmail,
        subject: `Rent Reminder - $${amount.toFixed(2)} Due on ${dueDate}`,
        html_content: customizedTemplate,
      });

      // Send push notification
      if (tenantId) {
        await this.sendPushNotification({
          user_id: tenantId,
          title: 'Rent Payment Reminder 🏠',
          body: `Your rent of $${amount.toFixed(2)} is due on ${dueDate}`,
          data: {
            type: 'rent_reminder',
            amount: amount.toString(),
            due_date: dueDate,
            screen: 'payment',
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to send rent reminder:', error);
      throw error;
    }
  }

  /**
   * Send maintenance request notification
   */
  async sendMaintenanceNotification(
    landlordEmail: string,
    landlordName: string,
    landlordId: string,
    tenantName: string,
    propertyAddress: string,
    issueDescription: string,
    priority: string,
  ): Promise<void> {
    try {
      const template = this.loadEmailTemplate('maintenance-request-email');
      const customizedTemplate = this.replaceTemplateVariables(template, {
        landlordName,
        tenantName,
        propertyAddress,
        issueDescription,
        priority,
        dashboardUrl: `${this.frontendUrl}/maintenance`,
        websiteUrl: this.frontendUrl,
      });

      await this.sendEmail({
        to_address: landlordEmail,
        subject: `New Maintenance Request - ${propertyAddress} (${priority} Priority)`,
        html_content: customizedTemplate,
      });

      // Send push notification
      if (landlordId) {
        await this.sendPushNotification({
          user_id: landlordId,
          title: '🔧 New Maintenance Request',
          body: `${tenantName} reported: ${issueDescription.substring(0, 50)}...`,
          data: {
            type: 'maintenance_request',
            property: propertyAddress,
            priority,
            screen: 'maintenance_details',
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to send maintenance notification:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail: string): Promise<boolean> {
    try {
      await this.sendEmail({
        to_address: testEmail,
        subject: 'RentInn Email Configuration Test',
        html_content:
          '<h1>Test Email</h1><p>Your email configuration is working correctly!</p>',
      });
      return true;
    } catch (error) {
      this.logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}
