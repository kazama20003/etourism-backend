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

  // --------------------------------------------------------------
  // 🔐 IPN – No usa JWT ni req.user
  // --------------------------------------------------------------
  @Post('ipn')
  async ipn(@Req() req: ExpressRequest) {
    console.log('>>> req.user =', req.user);
    return this.paymentsService.handleIpn(req.body as Buffer);
  }

  // --------------------------------------------------------------
  // 💳 FORM TOKEN – JWT OPCIONAL
  // --------------------------------------------------------------
  @UseGuards(OptionalJwtAuthGuard)
  @Post('form-token')
  createFormToken(
    @Body() dto: CreatePaymentDto,
    @Request() req: { user?: ValidatedUser },
  ) {
    const userId = req.user?._id?.toString();

    return this.paymentsService.createFormToken({
      ...dto,
      orderData: {
        ...dto.orderData,
        ...(userId && { userId }), // solo lo añade si existe
      },
    });
  }
}
