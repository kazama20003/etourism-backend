import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import envConfig from './config/env.config';
import { envValidationSchema } from './config/env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ToursModule } from './tours/tours.module';
import { OrdersModule } from './orders/orders.module';
import { OffersModule } from './offers/offers.module';
import { CartModule } from './cart/cart.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { UploadsModule } from './uploads/uploads.module';
import { TransportsModule } from './transports/transports.module';
import { PaymentsModule } from './payments/payments.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('app.mongodbUri');
        if (!uri) {
          throw new Error('La configuración app.mongodbUri no está definida.');
        }
        return { uri };
      },
    }),

    // ⭐ RATE LIMIT (NestJS 10)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 60 segundos en milisegundos
          limit: 20, // cantidad máxima por IP
        },
      ],
    }),

    UsersModule,
    AuthModule,
    ToursModule,
    OrdersModule,
    OffersModule,
    CartModule,
    VehicleModule,
    UploadsModule,
    TransportsModule,
    PaymentsModule,
    DashboardModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
