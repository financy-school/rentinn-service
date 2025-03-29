import { Injectable, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { AuthEntity } from './entities/auth.entity';
import { NotificationService } from '../client/notification/notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  AUTH_ID_PREFIX,
  SESSION_ID_PREFIX,
} from '../config/config';
import { v4 as uuidv4 } from 'uuid';

import { jwtDecode, JwtPayload } from 'jwt-decode';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RefreshAuthDto } from './dto/refresh-auth.dto';
import { ResendLoginOtp } from './dto/resend-login-otp.dto';
import { VerifyLoginOtp } from './dto/verify-login-otp.dto';
import { SendEmailNotification } from '../client/notification/dto/send-email-notification.dto';
import { SendSmsNotification } from '../client/notification/dto/send-sms-notification';

import {
  createRandomNumber,
  maskEmail,
  maskPhoneNumber,
} from '../core/helpers/commonHelper/commonHelper';
import { ConfigService } from '@nestjs/config';
import { customHttpError, ErrorCode } from '../core/custom-error/error-service';
import {
  AUTH_ALREADY_VERIFIED,
  AUTH_EXPIRED_SESSION,
  AUTH_NOT_FOUND,
  CREATION_FAILED,
  INVALID_TOKEN,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
} from '../core/custom-error/error-constant';
import {
  AUTH_ALREADY_VERIFIED_ERROR,
  AUTH_CREATE_ERROR,
  AUTH_EXPIRED_SESSION_ERROR,
  AUTH_INVALID_TOKEN_ERROR,
  AUTH_NOT_FOUND_ERROR,
  AUTH_TOO_MANY_REQUEST_ERROR,
} from './error.name';
import { CommonService } from '../common/common.service';

type auth_session_user = {
  org_id: string;
  org_user_id: string;
  auth_id: string;
  session_id: string;
};

const MIN_TO_MILLI_SEC = 60000;

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AuthEntity)
    private readonly auth_repository: Repository<AuthEntity>,
    private readonly jwt_service: JwtService,
    private readonly notification_service: NotificationService,
    private readonly common_service: CommonService,
  ) {
    this.sms_sender_address = this.config.get('SMS_SENDER_ADDRESS');
    this.email_sender_address = this.config.get('EMAIL_NOREPLY_SENDER_ADDRESS');
    this.otp_validity_in_minutes = this.config.get('OTP_VALIDITY_IN_MINUTES');
    this.access_token_expiration_duration = this.config.get(
      'ACCESS_TOKEN_EXPIRATION_DURATION',
    );
    this.refresh_token_expiration_duration = this.config.get(
      'REFRESH_TOKEN_EXPIRATION_DURATION',
    );
  }

  private readonly sms_sender_address: string;
  private readonly email_sender_address: string;
  private readonly otp_validity_in_minutes;
  private readonly access_token_expiration_duration: string;
  private readonly refresh_token_expiration_duration: string;

  async create(
    create_auth_dto: CreateAuthDto,
    is_otp_required: boolean = false,
  ) {
    try {
      const {
        email,
        phone_number,
        org_user_id,
        org_id,
        session_id,
        is_email_verified,
        is_phone_verified,
      } = create_auth_dto;

      const uuid = uuidv4().replace(/-/g, '');
      const new_auth_id = `${AUTH_ID_PREFIX}${uuid}`;

      const payload = { auth_id: new_auth_id, email, org_user_id, org_id };

      const access_token = this.jwt_service.sign(payload, {
        secret: JWT_ACCESS_SECRET,
        expiresIn: this.access_token_expiration_duration, // 1800s or 30 mins
      });
      const refresh_token = this.jwt_service.sign(payload, {
        secret: JWT_REFRESH_SECRET,
        expiresIn: this.refresh_token_expiration_duration, // 3600s or 60 mins or 1 hr
      });

      const decoded_access_token = jwtDecode<JwtPayload>(access_token);
      const decoded_refresh_token = jwtDecode<JwtPayload>(refresh_token);

      const new_auth = new AuthEntity();
      new_auth.auth_id = new_auth_id;
      new_auth.session_id =
        session_id || `${SESSION_ID_PREFIX}${uuidv4().replace(/-/g, '')}`;
      new_auth.email = email;
      new_auth.phone_number = phone_number;
      new_auth.school_id = org_id;
      new_auth.access_token = access_token;
      new_auth.refresh_token = refresh_token;
      new_auth.access_token_expire_at = new Date(
        decoded_access_token.exp * 1000,
      );
      new_auth.refresh_token_expire_at = new Date(
        decoded_refresh_token.exp * 1000,
      );
      new_auth.is_otp_required = is_otp_required;
      new_auth.is_active = true;

      if (is_otp_required) {
        new_auth.otp = await createRandomNumber(6);
        new_auth.otp_expires_at = new Date(
          new Date().getTime() + this.otp_validity_in_minutes * 60000,
        );
        new_auth.otp_attempt_count = 0;
        new_auth.otp_sent_count = 1;

        // Send OTP in Phone Number
        if (is_phone_verified) {
          await this.sendOtpSms(new_auth);
          new_auth.is_otp_sent_on_mobile = true;
          new_auth.otp_last_sent_at = new Date(new Date().toUTCString());
        }

        // Send OTP in Email
        if (is_email_verified) {
          await this.sendOtpEmail(new_auth);
          new_auth.is_otp_sent_on_email = true;
          new_auth.otp_last_sent_at = new Date(new Date().toUTCString());
        }
      }

      await this.auth_repository.save(new_auth);

      if (is_otp_required) {
        new_auth.email = await maskEmail(email);
        new_auth.phone_number = await maskPhoneNumber(phone_number);
      }

      // return plainToClass(AuthEntity, new_auth);
      return new_auth;
    } catch (err) {
      throw customHttpError(
        CREATION_FAILED,
        AUTH_CREATE_ERROR,
        'Failed to issue new Auth Token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async sendOtpEmail(new_auth: AuthEntity) {
    const email_otp_payload = await this.getEmailNotificationPayload(new_auth);
    const email_noti_obj = new SendEmailNotification(email_otp_payload);
    await this.notification_service.sendEmail(email_noti_obj);
  }

  private async sendOtpSms(new_auth: AuthEntity) {
    const body = `Your OTP for financy dashboard login is ${new_auth.otp}`;
    const otp_sms = new SendSmsNotification({
      sender: this.sms_sender_address,
      receiver: new_auth.phone_number,
      body,
    });
    await this.notification_service.sendSms(otp_sms);
  }

  private async getEmailNotificationPayload(new_auth: AuthEntity) {
    let custom_param: Object = {
      email: await maskEmail(new_auth.email),
      otp: new_auth.otp,
      expires_in: new_auth.otp_expires_at,
    };

    const payload = {
      template_name: this.config.get('EMAIL_OTP_TEMPLATE'),
      sender_address: this.email_sender_address,
      to_address: new_auth.email,
      subject: 'Your OTP for Financy Dashboard login',
      custom_param,
    };
    return payload;
  }

  async refresh(refresh_auth_dto: RefreshAuthDto) {
    const { refresh_token } = refresh_auth_dto;

    const existing_auth = await this.auth_repository.findOneBy({
      refresh_token,
      is_deleted: false,
    });

    if (!existing_auth) {
      this.logAndThrowError(
        INVALID_TOKEN,
        AUTH_INVALID_TOKEN_ERROR,
        'Invalid Refresh Token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // check if refresh-token has not already been used OR access-token has not been logged-out
    if (existing_auth.is_active !== true) {
      this.logAndThrowError(
        INVALID_TOKEN,
        AUTH_INVALID_TOKEN_ERROR,
        'Inactive token; Failed to refresh the token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // check if refresh-token is still valid and not expired.
    try {
      await this.jwt_service.verify(refresh_token, {
        secret: JWT_REFRESH_SECRET,
      });
    } catch (e) {
      this.logAndThrowError(
        INVALID_TOKEN,
        AUTH_INVALID_TOKEN_ERROR,
        'Token expired or malformed; Failed to refresh the token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // create new auth token
    const create_auth_dto = new CreateAuthDto({
      session_id: existing_auth.session_id,
      org_id: existing_auth.school_id,
      email: existing_auth.email,
    });
    const new_auth_token = await this.create(create_auth_dto);

    return new_auth_token;
  }

  async findOne(auth_id: string) {
    const auth = await this.auth_repository.findOneBy({
      auth_id,
      is_deleted: false,
    });
    if (!auth) {
      this.logAndThrowError(
        AUTH_NOT_FOUND,
        AUTH_NOT_FOUND_ERROR,
        'Auth not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    return auth;
  }

  async findAllByQuery(query: FindManyOptions<AuthEntity>) {
    const auth = await this.auth_repository.find(query);
    return auth;
  }

  async findOneByQuery(query: FindOneOptions<AuthEntity>) {
    const auth = await this.auth_repository.findOne(query);

    if (!auth) {
      throw customHttpError(
        NOT_FOUND,
        AUTH_NOT_FOUND_ERROR,
        'Auth not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return auth;
  }

  async verifyLoginOtp(verifyLoginOtp: VerifyLoginOtp) {
    const { session_id, otp, auth_id } = verifyLoginOtp;

    const existing_auth = await this.auth_repository.findOneBy({
      session_id,
      auth_id,
      is_active: true,
      is_deleted: false,
    });

    if (!existing_auth) {
      this.logAndThrowError(
        AUTH_EXPIRED_SESSION,
        AUTH_INVALID_TOKEN_ERROR,
        'Invalid or expired session',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (existing_auth.is_otp_verified) {
      this.logAndThrowError(
        AUTH_ALREADY_VERIFIED,
        AUTH_ALREADY_VERIFIED_ERROR,
        'Session has already been verified before.',
        HttpStatus.CONFLICT,
      );
    }
    const attempt_count = existing_auth.otp_attempt_count;
    const otp_max_attempt_allowed =
      this.config.get<number>('OTP_MAX_ATTEMPT_ALLOWED') || 3;
    const current_date = new Date().toUTCString();
    const current_time = new Date(current_date).getTime();
    const otp_expiry_time = new Date(existing_auth.otp_expires_at).getTime();
    const otp_timeout =
      (current_time - otp_expiry_time) / MIN_TO_MILLI_SEC >=
      this.otp_validity_in_minutes
        ? true
        : false;

    existing_auth.otp_attempt_count += 1;
    existing_auth.otp_last_attempt_at = new Date();

    if (attempt_count >= otp_max_attempt_allowed) {
      existing_auth.is_active = false;
      await this.auth_repository.save(existing_auth);
      this.logAndThrowError(
        TOO_MANY_REQUESTS,
        AUTH_TOO_MANY_REQUEST_ERROR,
        'Maximum OTP attempt reached. Please re-initiate the login by entering correct credentials.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    } else {
      if (otp_timeout) {
        existing_auth.is_active = false;
        await this.auth_repository.save(existing_auth);
        this.logAndThrowError(
          INVALID_TOKEN,
          AUTH_INVALID_TOKEN_ERROR,
          'OTP Expired',
          HttpStatus.GONE,
        );
      } else {
        if (existing_auth.otp === otp) {
          existing_auth.is_otp_verified = true;
          await this.auth_repository.save(existing_auth);

          return existing_auth;
        }

        await this.auth_repository.save(existing_auth);
        this.logAndThrowError(
          INVALID_TOKEN,
          AUTH_INVALID_TOKEN_ERROR,
          'Incorrect OTP',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
  }

  async resendLoginOtp(resend_login_otp: ResendLoginOtp) {
    const { session_id, auth_id } = resend_login_otp;

    const existing_auth = await this.auth_repository.findOneBy({
      session_id: session_id,
      auth_id,
      is_active: true,
      is_deleted: false,
      is_otp_verified: false,
      is_otp_required: true,
    });

    if (existing_auth) {
      const otp_sent_count = existing_auth.otp_sent_count;
      const otp_max_sending_allowed =
        this.config.get<number>('OTP_MAX_SENDING_ALLOWED') || 3;

      if (otp_sent_count <= otp_max_sending_allowed) {
        const sms_sender = this.config.get('SMS_SENDER_ADDRESS');
        const sms_receiver = existing_auth.phone_number;

        const time_left_for_otp_expiry =
          new Date(existing_auth.otp_expires_at).getTime() -
          new Date(new Date().toUTCString()).getTime();

        if (time_left_for_otp_expiry > 0) {
          existing_auth.otp = await createRandomNumber(6);
        } else {
          this.logAndThrowError(
            INVALID_TOKEN,
            AUTH_INVALID_TOKEN_ERROR,
            'OTP expired.',
            HttpStatus.GONE,
          );
        }
        if (existing_auth.is_otp_sent_on_email) {
          this.sendOtpEmail(existing_auth);
        }
        if (existing_auth.is_otp_sent_on_mobile) {
          this.sendOtpSms(existing_auth);
        }
        const current_date = new Date().toUTCString();
        existing_auth.otp_expires_at = new Date(
          new Date(current_date).getTime() +
            this.otp_validity_in_minutes * MIN_TO_MILLI_SEC,
        );
        existing_auth.otp_sent_count += 1;
        await this.auth_repository.save(existing_auth);
      } else {
        existing_auth.is_active = false;
        await this.auth_repository.save(existing_auth);
        this.logAndThrowError(
          TOO_MANY_REQUESTS,
          AUTH_TOO_MANY_REQUEST_ERROR,
          'OTP resend limit exceeded. Please re-initiate the login by entering correct credentials',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      this.logAndThrowError(
        AUTH_EXPIRED_SESSION,
        AUTH_EXPIRED_SESSION_ERROR,
        'Invalid or expired session',
        HttpStatus.GONE,
      );
    }
  }

  async logout(session_id: string) {
    const existing_sessions_raw: auth_session_user[] =
      await this.auth_repository
        .createQueryBuilder('auth')
        .select(['org_id', 'org_user_id', 'auth_id', 'session_id'])
        .where('session_id = :session_id', { session_id })
        .andWhere('is_active = :is_active', { is_active: true })
        .andWhere('is_deleted = :is_deleted', { is_deleted: false })
        .execute();

    const existing_sessions: auth_session_user[] = Object.values(
      JSON.parse(JSON.stringify(existing_sessions_raw)),
    );
    const existing_session_count = existing_sessions.length;

    if (existing_session_count > 0) {
      const org_id = existing_sessions[0].org_id;
      const org_user_id = existing_sessions[0].org_user_id;

      const is_active = false;
      const is_deleted = true;
      const deleted_at = new Date(new Date().toUTCString());

      await this.auth_repository
        .createQueryBuilder()
        .update(AuthEntity)
        .set({
          is_active: () => ':is_active',
          is_deleted: () => ':is_deleted',
          deleted_at: () => ':deleted_at',
        })
        .setParameter('is_active', is_active)
        .setParameter('is_deleted', is_deleted)
        .setParameter('deleted_at', deleted_at)
        .where('session_id = :session_id', { session_id })
        .andWhere('org_id = :org_id', { org_id })
        .andWhere('org_user_id = :org_user_id', { org_user_id })
        .execute();
    }

    return;
  }

  async logoutSessions(
    org_id: string,
    org_user_id: string,
    session_ids?: string[],
  ) {
    if (!!org_id && !!org_user_id) {
      let query = this.auth_repository
        .createQueryBuilder('auth')
        .select(['auth_id', 'session_id'])
        .where('org_user_id = :org_user_id', { org_user_id })
        .andWhere('org_id = :org_id', { org_id })
        .andWhere('is_active = :is_active', { is_active: true })
        .andWhere('is_deleted = :is_deleted', { is_deleted: false });

      if (session_ids && session_ids.length > 0) {
        query = query.andWhere('session_id NOT IN (:...session_ids)', {
          session_ids,
        });
      }

      const existing_sessions_raw: auth_session_user[] = await query.execute();

      const existing_sessions: auth_session_user[] = Object.values(
        JSON.parse(JSON.stringify(existing_sessions_raw)),
      );
      const existing_session_count = existing_sessions.length;

      if (existing_session_count > 0) {
        const is_active = false;
        const is_deleted = true;
        const deleted_at = new Date(new Date().toUTCString());

        let update_query = this.auth_repository
          .createQueryBuilder()
          .update(AuthEntity)
          .set({
            is_active: () => ':is_active',
            is_deleted: () => ':is_deleted',
            deleted_at: () => ':deleted_at',
          })
          .setParameter('is_active', is_active)
          .setParameter('is_deleted', is_deleted)
          .setParameter('deleted_at', deleted_at)
          .where('org_user_id = :org_user_id', { org_user_id })
          .andWhere('org_id = :org_id', { org_id });

        if (session_ids && session_ids.length > 0) {
          update_query = update_query.andWhere(
            'session_id NOT IN (:...session_ids)',
            {
              session_ids,
            },
          );
        }
        await update_query.execute();
      }
    }

    return;
  }

  private logAndThrowError(
    error_constant: ErrorCode,
    error_code: string,
    error_message: string,
    http_status: HttpStatus,
  ) {
    throw customHttpError(
      error_constant,
      error_code,
      error_message,
      http_status,
    );
  }
}
