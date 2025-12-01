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

@Module({
  imports: [
    // 1. Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
    }),

    // 2. Configuración de Mongoose (asíncrona)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('app.mongodbUri');

        if (!uri) {
          throw new Error('La configuración app.mongodbUri no está definida.');
        }

        return {
          uri,
          // opcional (si tienes dbName separado en tu env)
          // dbName: configService.get<string>('app.dbName'),
        };
      },
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
