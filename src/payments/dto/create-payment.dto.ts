// src/payments/dto/create-payment.dto.ts
import {
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';

export class CreatePaymentDto {
  @ValidateNested()
  @Type(() => CreateOrderDto)
  @IsNotEmpty()
  orderData: CreateOrderDto;

  // ✔️ Necesario para limpiar carrito de invitado
  @IsOptional()
  @IsString()
  sessionId?: string | null;

  // ✔️ Necesario para limpiar carrito de usuario autenticado
  @IsOptional()
  @IsMongoId()
  userId?: string | null;
}
