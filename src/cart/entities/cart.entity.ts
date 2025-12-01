import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

export type CartStatus = 'open' | 'converted' | 'abandoned';

@Schema({ timestamps: true })
export class Cart {
  // 🔗 Usuario dueño del carrito (si está logueado)
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  // Para invitados (guest cart), puedes guardar un token / sessionId
  @Prop()
  sessionId?: string;

  // 🛒 Items del carrito
  @Prop({
    type: [
      {
        productId: { type: Types.ObjectId, required: true },
        productType: {
          type: String,
          required: true,
          enum: ['tour', 'transport'], // 👈 VEHICLE REMOVIDO
        },

        // Fecha del servicio (solo aplica a tour / transport)
        travelDate: { type: Date },

        // Personas (solo tours)
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        infants: { type: Number, default: 0 },

        // Precios "congelados"
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },

        appliedOfferId: { type: Types.ObjectId, ref: 'Offer' },

        notes: { type: String },

        addedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  items: {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    productType: 'tour' | 'transport'; // 👈 SIN VEHICLE
    travelDate?: Date;
    adults?: number;
    children?: number;
    infants?: number;
    unitPrice: number;
    totalPrice: number;
    appliedOfferId?: Types.ObjectId;
    notes?: string;
    addedAt: Date;
  }[];

  // Totales del carrito
  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discountTotal: number;

  @Prop({ default: 0 })
  grandTotal: number;

  @Prop({
    default: 'open',
    enum: ['open', 'converted', 'abandoned'],
  })
  status: CartStatus;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ userId: 1, status: 1 });
CartSchema.index({ sessionId: 1, status: 1 });
