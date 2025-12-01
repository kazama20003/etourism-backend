import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';

export type TransportDocument = Transport & Document;

@Schema({ timestamps: true })
export class Transport {
  @Prop({ required: true })
  title: string;

  // 📝 DESCRIPCIÓN PRINCIPAL
  @Prop()
  description?: string;

  // 🌎 TRADUCCIONES
  @Prop({
    type: {
      en: { type: String },
      pt: { type: String },
      fr: { type: String },
    },
    default: {},
  })
  descriptionTranslations?: {
    en?: string;
    pt?: string;
    fr?: string;
  };

  // 🛣️ DESCRIPCIÓN DE LA RUTA EN TEXTO
  @Prop()
  routeDescription?: string;

  // 🗺️ RUTA DETALLADA
  @Prop({
    type: [
      {
        order: { type: Number, required: true },
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },

        // 🖼 Imagen por parada
        image: {
          url: { type: String },
          publicId: { type: String },
        },

        // Traducciones del nombre de la parada
        translations: {
          en: { type: String },
          pt: { type: String },
          fr: { type: String },
        },
      },
    ],
    default: [],
  })
  route?: {
    order: number;
    name: string;
    lat: number;
    lng: number;
    image?: {
      url: string;
      publicId: string;
    };
    translations?: {
      en?: string;
      pt?: string;
      fr?: string;
    };
  }[];

  // ORIGEN
  @Prop({
    type: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  })
  origin: {
    name: string;
    lat: number;
    lng: number;
  };

  // DESTINO
  @Prop({
    type: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  })
  destination: {
    name: string;
    lat: number;
    lng: number;
  };

  // 🚐 Vehículo asignado
  @Prop({ type: Types.ObjectId, ref: Vehicle.name, required: true })
  vehicle: Types.ObjectId;

  // 💸 Precios
  @Prop({ required: true })
  currentPrice: number;

  @Prop()
  oldPrice?: number;

  // 🕒 Duración total del transporte
  @Prop()
  durationHours?: number;

  @Prop()
  durationMinutes?: number;

  // 🕓 Horarios
  @Prop()
  departureTime?: string; // "08:30"

  @Prop()
  arrivalTime?: string; // "09:15"

  // Estado
  @Prop({ default: true })
  isActive: boolean;

  // Imágenes generales del transporte
  @Prop({
    type: [
      {
        url: String,
        publicId: String,
      },
    ],
    default: [],
  })
  images?: {
    url: string;
    publicId: string;
  }[];
}

export const TransportSchema = SchemaFactory.createForClass(Transport);
