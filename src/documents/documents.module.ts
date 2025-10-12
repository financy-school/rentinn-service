import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentEntity } from './entities/document.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomHttpModule } from '../core/custom-http-service/custom-http-service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentEntity]),
    ConfigModule,
    CustomHttpModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
