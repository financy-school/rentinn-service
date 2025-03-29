import { Module } from '@nestjs/common';
import { CustomConfigService } from '../../../src/core/config/config.service';

@Module({
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class CustomConfigModule {}
