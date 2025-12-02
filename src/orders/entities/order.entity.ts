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
  // 🔗 Usuario (opcional, para usuarios logueados)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  // 💬 Datos del cliente (requerido siempre)
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop()
  customerPhone?: string;

  // 🛒 ITEMS DEL PEDIDO (COPIA EXACTA DE Cart.items)
  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, required: true },
        productType: {
          type: String,
          required: true,
          enum: ['tour', 'transport'],
        },

        travelDate: { type: Date },

        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        infants: { type: Number, default: 0 },

        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },

        appliedOfferId: { type: Types.ObjectId, ref: 'Offer' },
        notes: { type: String },
        addedAt: { type: Date },
      },
    ],
    default: [],
  })
  items: {
    productId: Types.ObjectId;
    productType: 'tour' | 'transport';
    travelDate?: Date;
    adults?: number;
    children?: number;
    infants?: number;
    unitPrice: number;
    totalPrice: number;
    appliedOfferId?: Types.ObjectId;
    notes?: string;
    addedAt?: Date;
  }[];

  // 💵 Totales
  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  discountTotal: number;

  @Prop({ required: true })
  grandTotal: number;

  @Prop({ default: 'PEN' })
  currency: string;

  // 📌 Estado de la orden
  @Prop({
    default: OrderStatus.PENDING,
    enum: Object.values(OrderStatus),
  })
  status: OrderStatus;

  // 📌 Estado del pago
  @Prop({
    default: PaymentStatus.PENDING,
    enum: Object.values(PaymentStatus),
  })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentMethod?: string;

  @Prop()
  notes?: string;

  // 🔐 Código único de la orden (para buscar rápido)
  @Prop()
  confirmationCode?: string;

  // 📌 Relación al carrito original (opcional)
  @Prop({ type: Types.ObjectId, ref: 'Cart' })
  cartId?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// 🔍 Índices recomendados
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1, paymentStatus: 1 });
OrderSchema.index({ confirmationCode: 1 }, { unique: true, sparse: true });
OrderSchema.index({ 'items.productId': 1 });
OrderSchema.index({ 'items.travelDate': 1 });
