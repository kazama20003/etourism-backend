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

class CoordinatesDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
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

  // 🗣️ Traducción dinámica del nombre de la parada
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

export class CreateTransportDto {
  // 🏷️ Título principal (en idioma por defecto)
  @IsString()
  @IsNotEmpty()
  title: string;

  // 🌎 TRADUCCIONES DEL TITULO
  @IsOptional()
  @IsObject()
  titleTranslations?: Partial<Record<Lang, string>>;

  // Descripción general
  @IsOptional()
  @IsString()
  description?: string;

  // Traducciones de la descripción general
  @IsOptional()
  @IsObject()
  descriptionTranslations?: Partial<Record<Lang, string>>;

  // Descripción textual de la ruta
  @IsOptional()
  @IsString()
  routeDescription?: string;

  // Traducciones de la descripción de la ruta
  @IsOptional()
  @IsObject()
  routeDescriptionTranslations?: Partial<Record<Lang, string>>;

  // Ruta estructurada
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

  // Vehículo asignado
  @IsMongoId()
  vehicle: string;

  // Precios
  @IsNumber()
  currentPrice: number;

  @IsOptional()
  @IsNumber()
  oldPrice?: number;

  // Duración (minutos)
  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  // Imágenes generales
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images?: ImageDto[];
}
