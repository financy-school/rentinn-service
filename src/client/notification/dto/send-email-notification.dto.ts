import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class SendEmailNotification {
  @IsOptional()
  @IsEmail()
  sender_address?: string;

  @IsNotEmpty()
  @IsEmail()
  to_address: string;

  @IsOptional()
  @IsEmail()
  cc_address?: string;

  @IsOptional()
  @IsEmail()
  bcc_address?: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  html_content?: string;

  @IsOptional()
  @IsString()
  text_content?: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>[];
}
