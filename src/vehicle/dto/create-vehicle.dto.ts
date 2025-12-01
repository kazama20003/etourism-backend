import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CloudinaryImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  publicId: string;
}

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del vehículo es obligatorio.' })
  name: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsNumber()
  @Min(1, { message: 'La capacidad mínima debe ser 1.' })
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // 👇 NUEVO: imágenes
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloudinaryImageDto)
  @IsOptional()
  images?: CloudinaryImageDto[];
}
