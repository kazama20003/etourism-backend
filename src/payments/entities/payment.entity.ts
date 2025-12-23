// src/payments/entities/payment.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentStatus } from 'src/orders/entities/order.entity';
import type { PaymentOrderDraft } from '../types/payment-order-draft.type';

@Schema({ timestamps: true })
export class Payment {
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

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  orderDraft: PaymentOrderDraft;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: false })
  orderId?: Types.ObjectId;

  @Prop()
  transactionUuid?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  rawResponse?: Record<string, any>;

  @Prop({ index: true })
  izipayOrderId: string;

  @Prop()
  formToken: string;

  // ✔️ NECESARIOS PARA LIMPIAR CARRITO
  @Prop({ type: String, required: false })
  sessionId?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentDocument = Payment & Document;
export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1 });
