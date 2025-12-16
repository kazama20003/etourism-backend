import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsMongoId,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';

class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsEnum(['Tour', 'Transport'])
  productType: 'Tour' | 'Transport';

  @IsOptional()
  @IsDateString()
  travelDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  adults?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  infants?: number;

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

  @IsOptional()
  @IsDateString()
  addedAt?: string;
}

export class CreateOrderDto {
  // Usuario (opcional)
  @IsOptional()
  @IsMongoId()
  userId?: string;

  // Datos del cliente
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  // 🛒 ITEMS DEL PEDIDO
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Totales
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @IsNumber()
  @Min(0)
  grandTotal: number;

  @IsOptional()
  @IsString()
  currency?: string;

  // Estado (opcional: normalmente PENDING por defecto)
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Código opcional (lo puedes generar en el servicio)
  @IsOptional()
  @IsString()
  confirmationCode?: string;

  // Para rastrear qué cart se convirtió en order
  @IsOptional()
  @IsMongoId()
  cartId?: string;
}
