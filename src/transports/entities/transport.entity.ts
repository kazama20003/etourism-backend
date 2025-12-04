import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Lang } from 'src/common/constants/languages';

export type TransportDocument = Transport & Document;
export type TranslatedText = Partial<Record<Lang, string>>;

@Schema({ timestamps: true })
export class Transport {
  // TÍTULO (ES)
  @Prop({ required: true })
  title: string;

  // 🌎 Traducciones del título
  @Prop({ type: Object, default: {} })
  titleTranslations?: TranslatedText;

  // DESCRIPCIÓN PRINCIPAL (ES)
  @Prop()
  description?: string;

  // Traducciones
  @Prop({ type: Object, default: {} })
  descriptionTranslations?: TranslatedText;

  // DESCRIPCIÓN DE LA RUTA (ES)
  @Prop()
  routeDescription?: string;

  // Traducciones
  @Prop({ type: Object, default: {} })
  routeDescriptionTranslations?: TranslatedText;

  // RUTA DETALLADA
  @Prop({
    type: [
      {
        order: { type: Number, required: true },
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },

        image: {
          url: { type: String },
          publicId: { type: String },
        },

        translations: { type: Object, default: {} },
      },
    ],
    default: [],
  })
  route?: {
    order: number;
    name: string;
    lat: number;
    lng: number;
    image?: { url: string; publicId: string };
    translations?: TranslatedText;
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

  // VEHÍCULO
  @Prop({ type: Types.ObjectId, ref: Vehicle.name, required: true })
  vehicle: Types.ObjectId;

  // PRECIOS
  @Prop({ required: true })
  currentPrice: number;

  @Prop()
  oldPrice?: number;

  // DURACIÓN
  @Prop()
  durationHours?: number;

  @Prop()
  durationMinutes?: number;

  // HORARIOS
  @Prop()
  departureTime?: string;

  @Prop()
  arrivalTime?: string;

  // ESTADO
  @Prop({ default: true })
  isActive: boolean;

  // GALERÍA
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
