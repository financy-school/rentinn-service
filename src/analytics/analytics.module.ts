import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from '../rentals/entities/rental.entity';
import { Payment } from '../rentals/entities/payment.entity';
import { Property } from '../properties/entities/property.entity';
import { Room } from '../properties/entities/room.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rental, Payment, Property, Room, User]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
