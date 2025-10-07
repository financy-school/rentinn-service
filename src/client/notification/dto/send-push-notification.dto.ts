// send-push-notification.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUrl,
} from 'class-validator';

export class SendPushNotification {
  @IsNotEmpty()
  @IsString()
  user_id: string;

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
