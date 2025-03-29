import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEntity } from './entities/auth.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from '../client/notification/notification.module';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthEntity]),
    NotificationModule,
    ConfigModule,
    JwtModule.register({
      signOptions: { expiresIn: '60s' },
    }),
    CommonModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
