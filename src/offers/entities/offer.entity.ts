import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

export enum OfferType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum OfferProductType {
  TOUR = 'tour',
  TRANSPORT = 'transport',
}

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: OfferType.PERCENTAGE, enum: Object.values(OfferType) })
  type: OfferType;

  @Prop({ required: true })
  value: number;

  @Prop({ default: 0 })
  minTotal?: number;

  @Prop({ default: 1 })
  minPeople?: number;

  @Prop()
  maxUses?: number;

  @Prop({ default: 0 })
  usedCount?: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: true })
  isActive: boolean;

  // 🔥 NUEVO CAMPO: aplica a todo tipo de productos
  @Prop({ default: false })
  appliesToAll?: boolean;

  // Lista de items específicos
  @Prop({
    type: [
      {
        itemId: { type: Types.ObjectId, required: true },
        productType: {
          type: String,
          required: true,
          enum: Object.values(OfferProductType),
        },
      },
    ],
    default: [],
  })
  applicableItems?: {
    itemId: Types.ObjectId;
    productType: OfferProductType; // 'tour' | 'transport'
  }[];
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

OfferSchema.index({ code: 1 }, { unique: true });
OfferSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
OfferSchema.index({ 'applicableItems.itemId': 1 });
OfferSchema.index({ 'applicableItems.productType': 1 });
