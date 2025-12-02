import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType, OfferProductType } from '../entities/offer.entity';

class ApplicableItemDto {
  @IsMongoId()
  @IsNotEmpty()
  itemId: string;

  @IsEnum(OfferProductType)
  @IsNotEmpty()
  productType: OfferProductType; // 'tour' | 'transport'
}

export class CreateOfferDto {
  // Código único (Ej: VIAJE10)
  @IsString()
  @IsNotEmpty()
  code: string;

  // Título de la oferta
  @IsString()
  @IsNotEmpty()
  title: string;

  // Descripción opcional
  @IsOptional()
  @IsString()
  description?: string;

  // Tipo: porcentaje o monto fijo
  @IsEnum(OfferType)
  @IsNotEmpty()
  type: OfferType;

  // Valor (Ej 10% o S/.20)
  @IsNumber()
  @Min(0)
  value: number;

  // Min total
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTotal?: number;

  // Min personas
  @IsOptional()
  @IsNumber()
  @Min(1)
  minPeople?: number;

  // Máximo número de usos
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  // Fecha inicio
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // Fecha fin
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Activación
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Aplica a todo (general)
  @IsOptional()
  @IsBoolean()
  appliesToAll?: boolean;

  // Lista de items específicos: tours o transportes
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicableItemDto)
  applicableItems?: ApplicableItemDto[];
}
