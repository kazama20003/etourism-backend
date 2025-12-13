import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { PaymentStatus } from 'src/orders/entities/order.entity';

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'PEN' })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop()
  transactionUuid?: string;

  @Prop({ type: Object })
  rawResponse?: Record<string, any>;
}

export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
