import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

export enum OfferType {
  PERCENTAGE = 'percentage', // % de descuento
  FIXED = 'fixed', // monto fijo
}

@Schema({ timestamps: true })
export class Offer {
  // Código de oferta / cupón (único)
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({
    default: OfferType.PERCENTAGE,
    enum: Object.values(OfferType),
  })
  type: OfferType;

  // Valor del descuento:
  // - Si type === 'percentage' => 10 = 10%
  // - Si type === 'fixed'      => 50 = 50 unidades monetarias
  @Prop({ required: true })
  value: number;

  // Mínimo de monto para aplicar la oferta
  @Prop({ default: 0 })
  minTotal?: number;

  // Mínimo de personas para que aplique
  @Prop({ default: 1 })
  minPeople?: number;

  // Límite de usos totales (si no se manda => ilimitado)
  @Prop()
  maxUses?: number;

  // Conteo de cuántas veces se usó
  @Prop({ default: 0 })
  usedCount?: number;

  // Vigencia
  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  // Activa / inactiva
  @Prop({ default: true })
  isActive: boolean;

  // Si aplica a todos los tours
  @Prop({ default: false })
  appliesToAllTours?: boolean;

  // Si NO aplica a todos, lista de tours específicos
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tour' }], default: [] })
  tourIds: Types.ObjectId[];
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

OfferSchema.index({ code: 1 }, { unique: true });
OfferSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
OfferSchema.index({ tourIds: 1 });
