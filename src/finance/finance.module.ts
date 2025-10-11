import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Finance } from './entities/finance.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Payment } from '../rentals/entities/payment.entity';
import { Rental } from '../rentals/entities/rental.entity';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { NotificationModule } from '../client/notification/notification.module';
import { PropertiesModule } from '../properties/properties.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Finance,
      Invoice,
      InvoiceItem,
      Payment,
      Rental,
      User,
      Tenant,
    ]),
    NotificationModule,
    DocumentsModule,
    PropertiesModule,
  ],
  controllers: [FinanceController, InvoiceController],
  providers: [FinanceService, InvoiceService],
  exports: [InvoiceService],
})
export class FinanceModule {}
