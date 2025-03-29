import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
} from "class-validator";

export class SendEmailNotification {
  constructor(obj: {
    sender_address: string;
    to_address: string;
    cc_address?: string;
    bcc_address?: string;
    subject: string;
    template_name: string;
    custom_param?: Object;
  }) {
    this.sender_address = obj.sender_address;
    this.to_address = obj.to_address;
    this.cc_address = obj.cc_address;
    this.bcc_address = obj.bcc_address;
    this.subject = obj.subject;
    this.template_name = obj.template_name;
    this.custom_param = obj.custom_param;
  }

  @IsNotEmpty()
  @IsEmail()
  readonly sender_address: string;

  @IsNotEmpty()
  @IsEmail()
  readonly to_address: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly cc_address: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly bcc_address: string;

  @IsNotEmpty()
  @IsString()
  readonly subject: string;

  @IsNotEmpty()
  @IsEmail()
  readonly template_name: string;

  @IsNotEmpty()
  @IsObject()
  @IsOptional()
  readonly custom_param: Object;
}
