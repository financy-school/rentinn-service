import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { AuthEntity } from './auth/entities/auth.entity';
import { TenantModule } from './tenant/tenant.module';
import { FinanceModule } from './finance/finance.module';
import { Tenant } from './tenant/entities/tenant.entity';
import { Finance } from './finance/entities/finance.entity';
import { Kyc } from './kyc/entities/kyc.entity';
import { Payment } from './rentals/entities/payment.entity';
import { Rental } from './rentals/entities/rental.entity';
import { User } from './users/entities/user.entity';
import { Property } from './properties/entities/property.entity';
import { PropertiesModule } from './properties/properties.module';
import { Room } from './properties/entities/room.entity';

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
        console.log(config);
        return {
          type: 'mysql',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_DATABASE'),
          entities: [
            AuthEntity,
            Property,
            Room,
            Tenant,
            Finance,
            Kyc,
            Payment,
            Rental,
            User,
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

    TenantModule,
    FinanceModule,
  ],
})
export class AppModule {}
