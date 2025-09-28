import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantsController } from './tenant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { Room } from '../properties/entities/room.entity';
import { Property } from '../properties/entities/property.entity';
import { KycModule } from '../kyc/kyc.module';
import { RentalsModule } from '../rentals/rentals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Room, Property]),
    KycModule,
    RentalsModule,
  ],
  controllers: [TenantsController],
  providers: [TenantService],
})
export class TenantModule {}
