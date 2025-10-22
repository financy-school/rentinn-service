import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycPublicController } from './kyc-public.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from './entities/kyc.entity';
import { Tenant, User } from '../entities';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc, Tenant, User]), DocumentsModule],
  controllers: [KycController, KycPublicController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
