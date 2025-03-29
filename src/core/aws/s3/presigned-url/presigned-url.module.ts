import { Module } from '@nestjs/common';
// import { ConfigModule } from "@nestjs/config";

import { PresignedUrlService } from './presigned-url.service';

@Module({
  imports: [],
  providers: [PresignedUrlService],
  exports: [PresignedUrlService],
})
export class PresignedUrlModule {}
