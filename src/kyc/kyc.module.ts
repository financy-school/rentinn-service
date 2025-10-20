import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycPublicController } from './kyc-public.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from './entities/kyc.entity';
import { Tenant } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc, Tenant])],
  controllers: [KycController, KycPublicController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
