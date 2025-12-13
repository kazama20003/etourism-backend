import {
  IsOptional,
  IsMongoId,
  IsString,
  IsArray,
  ValidateNested,
  IsIn,
  IsDateString,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCartItemDto {
  @IsMongoId()
  productId: string;

  @IsIn(['Tour', 'Transport'])
  productType: 'Tour' | 'Transport';

  // Fecha del servicio
  @IsOptional()
  @IsDateString()
  travelDate?: string;

  // Personas (tours)
  @IsOptional()
  @IsInt()
  @Min(1)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  infants?: number;

  // Precios congelados
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsOptional()
  @IsMongoId()
  appliedOfferId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCartDto {
  // Invitado
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items?: CreateCartItemDto[];
}
