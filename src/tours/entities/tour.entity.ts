import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TourDocument = Tour & Document;

@Schema({ timestamps: true })
export class Tour {
  @Prop({ required: true, unique: true })
  title: string; // 🇪🇸 texto base en español

  @Prop({ required: true })
  description: string; // 🇪🇸

  // 📸 Imágenes manejadas con Cloudinary
  @Prop({
    type: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    default: [],
  })
  images: {
    url: string;
    publicId: string;
  }[];

  @Prop()
  videoUrl?: string;

  @Prop({ required: true })
  locationName: string;

  @Prop({
    type: { lat: Number, lng: Number },
    required: false,
  })
  coordinates?: { lat: number; lng: number };

  @Prop({ required: true })
  durationDays: number;

  @Prop()
  durationHours?: number;

  @Prop({ default: 'medium', enum: ['easy', 'medium', 'hard'] })
  difficulty: 'easy' | 'medium' | 'hard';

  @Prop({ default: 0 })
  minAge?: number;

  @Prop({ default: 20 })
  capacity?: number;

  @Prop()
  meetingPoint?: string;

  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;

  // Beneficios y Recomendaciones (🇪🇸 base)
  @Prop([String])
  benefits?: string[];

  @Prop([String])
  preparations?: string[];

  // 🚀 ITINERARIO OPTIMIZADO (🇪🇸 idioma base)
  @Prop({
    type: [
      {
        order: Number,
        title: String,
        description: String,
        durationHours: Number,
        images: [String],
        activities: [String],
        meals: {
          breakfast: { type: Boolean, default: false },
          lunch: { type: Boolean, default: false },
          dinner: { type: Boolean, default: false },
        },
        hotelNight: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  itinerary: {
    order: number;
    title: string;
    description: string;
    durationHours?: number;
    images?: string[];
    activities?: string[];
    meals?: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
    };
    hotelNight?: boolean;
  }[];

  // 🌍 TRADUCCIONES (solo campos que necesitas traducir)
  // aquí van IT, DE, EN, etc. PERO NO ES.
  @Prop({
    type: [
      {
        lang: { type: String, required: true }, // 'it', 'de', 'en', etc.
        title: String,
        description: String,
        slug: String,
        meetingPoint: String,
        metaDescription: String,
        includes: [String],
        excludes: [String],
        categories: [String],
        itinerary: [
          {
            order: Number,
            title: String,
            description: String,
          },
        ],
      },
    ],
    default: [],
  })
  translations: {
    lang: string; // 'it' | 'de' | 'en' | ...
    title?: string;
    description?: string;
    slug?: string;
    meetingPoint?: string;
    metaDescription?: string;
    includes?: string[];
    excludes?: string[];
    categories?: string[];
    itinerary?: {
      order: number;
      title?: string;
      description?: string;
    }[];
  }[];

  // 🚌 Transporte
  @Prop({ default: true })
  hasTransport: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Vehicle' }], default: [] })
  vehicleIds: Types.ObjectId[];

  // 🧑‍🏫 Guía
  @Prop({ default: true })
  hasGuide: boolean;

  // 💰 Precios
  @Prop({ required: true })
  currentPrice: number;

  @Prop()
  oldPrice?: number;

  @Prop({ type: [{ people: Number, discount: Number }], default: [] })
  discounts?: { people: number; discount: number }[];

  // 🗓️ DISPONIBILIDAD Y REGLAS DE RESERVA
  @Prop({
    default: 'unlimited',
    enum: ['unlimited', 'fixed_dates', 'date_range'],
  })
  availabilityType: 'unlimited' | 'fixed_dates' | 'date_range';

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop([Date])
  availableDates: Date[];

  @Prop({ default: false })
  limitCapacity?: boolean;

  @Prop({ default: 1 })
  minPeoplePerBooking?: number;

  @Prop({ default: 10 })
  maxPeoplePerBooking?: number;

  @Prop({ default: 24 })
  cutoffHoursBeforeStart?: number;

  @Prop({ default: true })
  instantConfirmation?: boolean;

  @Prop({ default: true })
  isBookable?: boolean;

  @Prop([String])
  includes: string[];

  @Prop([String])
  excludes: string[];

  @Prop([String])
  categories: string[];

  // aquí puedes guardar qué idiomas soporta este tour, ej: ['es', 'it', 'de']
  @Prop([String])
  languages: string[];

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviewsCount: number;

  @Prop()
  cancellationPolicy?: string;

  @Prop()
  refundPolicy?: string;

  @Prop()
  changePolicy?: string;

  @Prop({ default: true })
  isActive: boolean;

  // slug del idioma base (ej: ES)
  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  metaDescription?: string;
}

export const TourSchema = SchemaFactory.createForClass(Tour);

TourSchema.index({ title: 1 });
TourSchema.index({ categories: 1 });
TourSchema.index({ rating: -1 });
TourSchema.index({ locationName: 1 });
TourSchema.index({ isActive: 1, isBookable: 1, availabilityType: 1 });
TourSchema.index({ vehicleIds: 1 });
TourSchema.index({ 'translations.lang': 1 });
