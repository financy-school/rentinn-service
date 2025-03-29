import { Injectable } from '@nestjs/common';
import { SendEmailNotification } from './dto/send-email-notification.dto';
import { SendSmsNotification } from './dto/send-sms-notification';
// import dotenv from "dotenv";

import { IsUrl, IsNotEmpty, IsString, IsBoolean } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { CustomHttpService } from '../../core/custom-http-service/custom-http-service.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly config: ConfigService,
    private http_service: CustomHttpService,
  ) {
    if (
      this.config.get(`AWS_SQS_ACCESS_KEY`) &&
      this.config.get(`AWS_SQS_SECRET_ACCESS_KEY`)
    ) {
      const aws_credentials = {
        accessKeyId: this.config.get(`AWS_SQS_ACCESS_KEY`),
        secretAccessKey: this.config.get(`AWS_SQS_SECRET_ACCESS_KEY`),
      };
      AWS.config.credentials = new AWS.Credentials(aws_credentials);
    }

    AWS.config.region = this.config.get(`AWS_SQS_REGION`);
    this.sqs_client = new AWS.SQS();

    this.email_template_service_url =
      this.config.get<string>(`EMAIL_TEMPLATE_SERVICE_URL`) || '';

    this.notification_queue_url =
      this.config.get<string>(`AWS_SQS_NOTIFICATION_QUEUE_URL`) || '';

    this.email_sending_enabled =
      this.config.get(`EMAIL_SENDING_ENABLED`) === 'true';
    this.sms_sending_enabled =
      this.config.get(`SMS_SENDING_ENABLED`) === 'true';
  }

  @IsNotEmpty()
  @IsUrl()
  readonly email_template_service_url: string;

  @IsNotEmpty()
  @IsString()
  readonly notification_queue_url: string;

  @IsNotEmpty()
  @IsBoolean()
  readonly email_sending_enabled: boolean;

  @IsNotEmpty()
  @IsBoolean()
  readonly sms_sending_enabled: boolean;

  readonly sqs_client;

  async sendEmail(sendEmailNotification: SendEmailNotification) {
    if (this.email_sending_enabled) {
      const {
        sender_address,
        to_address,
        cc_address,
        bcc_address,
        subject,
        template_name,
        custom_param,
      } = sendEmailNotification;

      const req_body = {
        template_name: template_name,
        data: custom_param,
      };

      const resp = (
        await this.http_service.post(
          this.email_template_service_url,
          req_body,
          {},
        )
      ).data;

      const email_body = resp.data.html_template;

      let buff = Buffer.from(email_body, 'base64');
      const email_body_plain_text = buff.toString('ascii');

      const message = {
        notification_type: 'EMAIL',
        email_data: {
          sender_address: sender_address,
          receiver_address: {
            to_address: [to_address],
            cc_address: cc_address ? [cc_address] : [],
            bcc_address: bcc_address ? [bcc_address] : [],
          },
          subject: subject,
          body: email_body_plain_text,
        },
      };

      await this.enQueue(this.notification_queue_url, message);
    } else {
    }

    return;
  }

  async sendSms(sendSmsNotification: SendSmsNotification) {
    if (this.sms_sending_enabled) {
      const { sender, receiver, body } = sendSmsNotification;

      const message = {
        notification_type: 'SMS',
        sms_data: {
          sender,
          receiver,
          body,
        },
      };

      await this.enQueue(this.notification_queue_url, message);
    } else {
    }
    return;
  }

  async enQueue(queue_url: string, message: Object | string, delayTime = 0) {
    this.sqs_client.sendMessage(
      {
        MessageBody: JSON.stringify(message),
        // MessageGroupId: uuidv4(), //unique
        // MessageDeduplicationId: uuidv4(), //unique may be same as above
        QueueUrl: queue_url,
        DelaySeconds: delayTime,
      },
      (err, result) => {
        if (err) {
        } else {
        }
      },
    );

    return;
  }
}
