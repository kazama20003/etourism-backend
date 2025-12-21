// src/payments/payments.controller.ts
import {
  Controller,
  Post,
  Req,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ValidatedUser } from '../auth/auth.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─────────────────────────────────────
  // 🔐 IPN IZIPAY (RAW BODY - SIN JWT)
  // ─────────────────────────────────────
  @Post('ipn')
  async ipn(@Req() req: ExpressRequest) {
    console.log('>>> req.user =', req.user);

    // IZIPAY SIEMPRE ENVÍA RAW BUFFER
    return this.paymentsService.handleIpn(req.body as Buffer);
  }

  // ─────────────────────────────────────
  // 💳 CREAR FORM TOKEN (JWT OPCIONAL)
  // ─────────────────────────────────────
  @UseGuards(OptionalJwtAuthGuard)
  @Post('form-token')
  createFormToken(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user?: ValidatedUser },
  ) {
    return this.paymentsService.createFormToken({
      ...dto,
      orderData: {
        ...dto.orderData,
        // 👇 userId SOLO SI EL USUARIO ESTÁ LOGUEADO
        userId: req.user?._id?.toString(),
      },
    });
  }
}
