import { Module } from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { RentalsController } from './rentals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { Payment } from './entities/payment.entity';
import { PropertiesModule } from '../properties/properties.module';
import { KycModule } from '../kyc/kyc.module';
import { NotificationModule } from '../client/notification/notification.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rental, Payment]),
    PropertiesModule,
    KycModule,
    NotificationModule,
    DocumentsModule,
  ],
  controllers: [RentalsController],
  providers: [RentalsService],
  exports: [RentalsService],
})
export class RentalsModule {}
