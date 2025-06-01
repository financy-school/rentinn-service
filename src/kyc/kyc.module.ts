import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kyc } from './entities/kyc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kyc])],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
