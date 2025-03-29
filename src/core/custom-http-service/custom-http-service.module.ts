import { Module } from '@nestjs/common';
import { CustomHttpService } from './custom-http-service.service';
import { CustomHttpServiceController } from './custom-http-service.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CustomHttpServiceController],
  providers: [CustomHttpService],
  exports: [CustomHttpService],
})
export class CustomHttpModule {}
