// src/payments/dto/create-payment.dto.ts
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';

export class CreatePaymentDto {
  @ValidateNested()
  @Type(() => CreateOrderDto)
  @IsNotEmpty()
  orderData: CreateOrderDto;
}
