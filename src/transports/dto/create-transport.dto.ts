import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsArray,
  ValidateNested,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Lang } from 'src/common/constants/languages';

// -------------------------
// SUB-DTOS
// -------------------------

class CoordinatesDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class RouteImageDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  publicId?: string;
}

class RouteStepDto {
  @IsNumber()
  @Min(1)
  order: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RouteImageDto)
  image?: RouteImageDto;

  @IsOptional()
  @IsObject()
  translations?: Partial<Record<Lang, string>>;
}

class ImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  publicId: string;
}

// -------------------------
// DTO PRINCIPAL
// -------------------------

export class CreateTransportDto {
  // TÍTULO
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsObject()
  titleTranslations?: Partial<Record<Lang, string>>;

  // DESCRIPCIÓN
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  descriptionTranslations?: Partial<Record<Lang, string>>;

  // DESCRIPCIÓN DE LA RUTA
  @IsOptional()
  @IsString()
  routeDescription?: string;

  @IsOptional()
  @IsObject()
  routeDescriptionTranslations?: Partial<Record<Lang, string>>;

  // RUTA DETALLADA
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStepDto)
  route?: RouteStepDto[];

  // ORIGEN
  @ValidateNested()
  @Type(() => CoordinatesDto)
  origin: CoordinatesDto;

  // DESTINO
  @ValidateNested()
  @Type(() => CoordinatesDto)
  destination: CoordinatesDto;

  // VEHÍCULO
  @IsMongoId()
  vehicle: string;

  // PRECIOS
  @IsNumber()
  currentPrice: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  // DURACIÓN
  @IsOptional()
  @IsNumber()
  durationHours?: number;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  // HORARIOS
  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsString()
  arrivalTime?: string;

  // IMÁGENES
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];
}
