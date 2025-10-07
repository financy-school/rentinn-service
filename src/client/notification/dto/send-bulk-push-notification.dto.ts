// send-bulk-push-notification.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUrl,
} from 'class-validator';

export class SendBulkPushNotification {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  user_ids: string[];

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

  @IsOptional()
  @IsUrl()
  image_url?: string;
}
