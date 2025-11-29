import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Order {
  // 🔗 Referencia al Tour SOLO por ID
  @Prop({ type: Types.ObjectId, ref: 'Tour', required: true })
  tourId: Types.ObjectId;

  // (Opcional) referencia al usuario si luego lo manejas
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  // Datos del cliente (por si no hay login)
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop()
  customerPhone?: string;

  // Fecha del tour/reserva
  @Prop({ required: true })
  travelDate: Date;

  // Cantidad de personas
  @Prop({ default: 1 })
  adults: number;

  @Prop({ default: 0 })
  children: number;

  @Prop({ default: 0 })
  infants: number;

  // Estado de la reserva
  @Prop({
    default: OrderStatus.PENDING,
    enum: Object.values(OrderStatus),
  })
  status: OrderStatus;

  // Estado del pago
  @Prop({
    default: PaymentStatus.PENDING,
    enum: Object.values(PaymentStatus),
  })
  paymentStatus: PaymentStatus;

  // Método de pago (yape, plin, tarjeta, etc.)
  @Prop()
  paymentMethod?: string;

  @Prop()
  notes?: string;

  // Total final de la reserva
  @Prop({ required: true })
  totalPrice: number;

  @Prop({ default: 'PEN' })
  currency: string;

  // Oferta aplicada (si existe)
  @Prop({ type: Types.ObjectId, ref: 'Offer' })
  appliedOfferId?: Types.ObjectId;

  // Código de confirmación (para buscar la reserva rápido)
  @Prop()
  confirmationCode?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Índices útiles
OrderSchema.index({ tourId: 1, travelDate: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ confirmationCode: 1 }, { unique: true, sparse: true });
