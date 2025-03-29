import {
  Controller,
  Param,
  Delete,
  Body,
  Post,
  ClassSerializerInterceptor,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshAuthDto } from './dto/refresh-auth.dto';
import { VerifyLoginOtp } from './dto/verify-login-otp.dto';
import { ResendLoginOtp } from './dto/resend-login-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth_service: AuthService) {}

  @Get(':auth_id')
  getAuth(@Param('auth_id') auth_id: string) {
    return this.auth_service.findOne(auth_id);
  }

  @Post('/refresh')
  refresh(@Body() refresh_auth_dto: RefreshAuthDto) {
    return this.auth_service.refresh(refresh_auth_dto);
  }

  @Post('/verifyLoginOtp')
  verifyLoginOtp(@Body() verifyLoginOtp: VerifyLoginOtp) {
    return this.auth_service.verifyLoginOtp(verifyLoginOtp);
  }

  @Post('/resendLoginOtp')
  resendLoginOtp(@Body() resendLoginOtp: ResendLoginOtp) {
    return this.auth_service.resendLoginOtp(resendLoginOtp);
  }

  @Delete(':session_id')
  logout(@Param('session_id') session_id: string) {
    return this.auth_service.logout(session_id);
  }
}
