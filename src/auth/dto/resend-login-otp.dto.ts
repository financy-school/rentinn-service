import { IsNotEmpty, IsString } from 'class-validator';

export class ResendLoginOtp {
  @IsNotEmpty()
  @IsString()
  readonly session_id: string;

  @IsNotEmpty()
  @IsString()
  readonly auth_id: string;
}
