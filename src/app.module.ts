import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { TenantModule } from './tenant/tenant.module';
import { FinanceModule } from './finance/finance.module';
import { PropertiesModule } from './properties/properties.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TicketsModule } from './tickets/tickets.module';
import { DocumentsModule } from './documents/documents.module';
import * as Entities from './entities';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_DATABASE'),
          entities: [
            Entities.AuthEntity,
            Entities.Property,
            Entities.Room,
            Entities.Tenant,
            Entities.Finance,
            Entities.Invoice,
            Entities.InvoiceItem,
            Entities.Kyc,
            Entities.Payment,
            Entities.Rental,
            Entities.User,
            Entities.Ticket,
            Entities.DocumentEntity,
          ],
          // synchronize: config.get('DB_SYNC'),
          synchronize: true,
          logging: ['query', 'schema'],
        };
      },
    }),
    AuthModule,
    CommonModule,
    PropertiesModule,
    AnalyticsModule,
    TenantModule,
    FinanceModule,
    TicketsModule,
    DocumentsModule,
  ],
})
export class AppModule {}
