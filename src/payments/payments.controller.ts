// src/payments/payments.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { IzipayIpnPayload } from './types/izipay-ipn.type';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 🔐 IPN IZIPAY
  @Post('ipn')
  async ipn(@Body() body: IzipayIpnPayload) {
    return this.paymentsService.handleIpn(body);
  }

  // 💳 Crear FormToken
  @Post('form-token')
  createFormToken(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createFormToken(dto);
  }
}
