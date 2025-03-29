import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';

import { CommonModule } from './common/common.module';
import { AuthEntity } from './auth/entities/auth.entity';
import { PropertyModule } from './property/property.module';
import { RoomModule } from './room/room.module';
import { TenantModule } from './tenant/tenant.module';
import { FinanceModule } from './finance/finance.module';
import { Property } from './property/entities/property.entity';
import { Room } from './room/entities/room.entity';
import { Tenant } from './tenant/entities/tenant.entity';
import { Finance } from './finance/entities/finance.entity';

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
          entities: [AuthEntity, Property, Room, Tenant, Finance],
          // synchronize: config.get('DB_SYNC'),
          synchronize: true,
          logging: ['query', 'schema'],
        };
      },
    }),

    AuthModule,
    CommonModule,
    PropertyModule,
    RoomModule,
    TenantModule,
    FinanceModule,
  ],
})
export class AppModule {}
