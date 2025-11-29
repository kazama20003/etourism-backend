import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsDateString,
  IsPositive,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

// --------------------
// Constantes / tipos de apoyo
// --------------------

export const DifficultyValues = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DifficultyValues)[number];

export const AvailabilityTypeValues = [
  'unlimited',
  'fixed_dates',
  'date_range',
] as const;
export type AvailabilityType = (typeof AvailabilityTypeValues)[number];

// --------------------
// DTOs anidados
// --------------------

export class CloudinaryImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  publicId: string;
}

export class CoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class ItineraryItemDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationHours?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];

  @IsOptional()
  meals?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };

  @IsOptional()
  @IsBoolean()
  hotelNight?: boolean;
}

export class DiscountDto {
  @IsInt()
  @Min(1)
  people: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discount: number; // porcentaje o lo que definas en tu lógica
}

// --------------------
// CreateTourDto principal
// --------------------

export class CreateTourDto {
  // Básicos
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // Imágenes Cloudinary
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloudinaryImageDto)
  images?: CloudinaryImageDto[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsString()
  @IsNotEmpty()
  locationName: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @IsInt()
  @Min(1)
  durationDays: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationHours?: number;

  @IsOptional()
  @IsIn(DifficultyValues)
  difficulty?: Difficulty;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  // Beneficios y recomendaciones
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preparations?: string[];

  // Itinerario
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryItemDto)
  itinerary?: ItineraryItemDto[];

  // Transporte
  @IsOptional()
  @IsBoolean()
  hasTransport?: boolean;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  vehicleIds?: string[];

  // Guía
  @IsOptional()
  @IsBoolean()
  hasGuide?: boolean;

  // Precios
  @IsNumber()
  @IsPositive()
  currentPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiscountDto)
  discounts?: DiscountDto[];

  // Disponibilidad y reglas de reserva
  @IsOptional()
  @IsIn(AvailabilityTypeValues)
  availabilityType?: AvailabilityType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true }) // 👈 aquí el fix
  availableDates?: string[];

  @IsOptional()
  @IsBoolean()
  limitCapacity?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  minPeoplePerBooking?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPeoplePerBooking?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cutoffHoursBeforeStart?: number;

  @IsOptional()
  @IsBoolean()
  instantConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  // Incluye / excluye
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludes?: string[];

  // Categorías y lenguajes
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  // Meta / rating
  @IsOptional()
  @IsNumber()
  @Min(0)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reviewsCount?: number;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @IsOptional()
  @IsString()
  changePolicy?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;
}
