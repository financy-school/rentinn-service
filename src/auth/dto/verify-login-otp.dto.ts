import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VerifyLoginOtp {
  @IsNotEmpty()
  @IsString()
  readonly session_id: string;

  @IsNotEmpty()
  @IsString()
  readonly auth_id: string;

  @IsNotEmpty()
  @IsString()
  readonly otp: string;
}
