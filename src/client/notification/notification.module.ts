import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ConfigModule } from '@nestjs/config';
import { CustomHttpModule } from '../../core/custom-http-service/custom-http-service.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities';

@Module({
  imports: [ConfigModule, CustomHttpModule, TypeOrmModule.forFeature([User])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
