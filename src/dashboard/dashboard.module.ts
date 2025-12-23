// src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/orders/entities/order.entity';
import { Payment, PaymentSchema } from 'src/payments/entities/payment.entity';
import { Tour, TourSchema } from 'src/tours/entities/tour.entity';
import {
  Transport,
  TransportSchema,
} from 'src/transports/entities/transport.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Tour.name, schema: TourSchema },
      { name: Transport.name, schema: TransportSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
