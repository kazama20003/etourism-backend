import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

export type CartStatus = 'open' | 'converted' | 'abandoned';

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop()
  sessionId?: string;

  @Prop({
    type: [
      {
        productId: {
          type: Types.ObjectId,
          required: true,
          refPath: 'items.productType', // 👈 ESTA LÍNEA FALTABA
        },

        productType: {
          type: String,
          required: true,
          enum: ['Tour', 'Transport'],
        },
        travelDate: { type: Date },
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        infants: { type: Number, default: 0 },
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
    _id?: Types.ObjectId; // ✅ OPCIONAL
    productId: Types.ObjectId;
    productType: 'Tour' | 'Transport';
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
  status: 'open' | 'converted' | 'abandoned';
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.index({ userId: 1, status: 1 });
CartSchema.index({ sessionId: 1, status: 1 });
