import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateAuthDto {
  constructor(obj: {
    email: string;
    org_id: string;
    phone_number?: string;
    session_id?: string;
    is_email_verified?: boolean;
    is_phone_verified?: boolean;
    is_bo_admin_login?: boolean;
    is_partner_admin_login?: boolean;
  }) {
    this.session_id = obj.session_id;
    this.org_id = obj.org_id;
    this.email = obj.email;
    this.phone_number = obj.phone_number;
    this.is_email_verified = obj.is_email_verified;
    this.is_phone_verified = obj.is_phone_verified;
    this.is_bo_admin_login = obj.is_bo_admin_login;
    this.is_partner_admin_login = obj.is_partner_admin_login;
  }

  @IsString()
  @IsOptional()
  readonly session_id: string;

  @IsNotEmpty()
  @IsString()
  readonly org_id: string;

  @IsNotEmpty()
  @IsString()
  readonly org_user_id: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsOptional()
  readonly phone_number: string;

  @IsNotEmpty()
  @IsBoolean()
  readonly is_email_verified: boolean = false;

  @IsNotEmpty()
  @IsBoolean()
  readonly is_phone_verified: boolean = false;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  readonly is_bo_admin_login: boolean = false;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  readonly is_partner_admin_login: boolean = false;
}
