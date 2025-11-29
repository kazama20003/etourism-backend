import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ required: true })
  name: string; // Ej: "Minivan 15 pax"

  @Prop()
  brand?: string; // Ej: "Hyundai"

  @Prop()
  model?: string; // Ej: "H1"

  @Prop()
  plate?: string;

  @Prop({ default: 15 })
  capacity?: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
