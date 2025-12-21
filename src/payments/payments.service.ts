// src/payments/payments.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as qs from 'querystring';

import { Payment, PaymentDocument } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus, OrderStatus } from '../orders/entities/order.entity';
import { IzipayAnswer } from './types/izipay-ipn.type';
import { MailService } from '../mail/mail.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { IzipayCreatePaymentResponse } from './types/izipay-response.type';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../cart/cart.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly ordersService: OrdersService,
    private readonly mailService: MailService,
    private readonly cartService: CartService,
    private readonly http: HttpService,
  ) {}

  // --------------------------------------------------------------------
  // IPN
  // --------------------------------------------------------------------
  async handleIpn(rawBody: Buffer) {
    if (!rawBody || !rawBody.length) {
      return { status: 'IGNORED' };
    }

    const bodyString = rawBody.toString('utf8');
    const payload = qs.parse(bodyString);

    const krAnswer = payload['kr-answer'];
    const krHash = payload['kr-hash'];
    const krHashKey = payload['kr-hash-key'];

    if (!krAnswer || !krHash || !krHashKey) {
      return { status: 'IGNORED' };
    }

    const hashKey = Array.isArray(krHashKey) ? krHashKey[0] : krHashKey;

    let secret: string;
    if (hashKey === 'sha256_hmac') {
      secret = process.env.IZIPAY_HMACSHA256!;
    } else if (hashKey === 'password') {
      secret = process.env.IZIPAY_PASSWORD!;
    } else {
      return { status: 'IGNORED' };
    }

    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(krAnswer as string)
      .digest('hex');

    const receivedHash = Array.isArray(krHash) ? krHash[0] : krHash;

    if (computedHash !== receivedHash) {
      this.logger.error('❌ Invalid IPN signature');
      return { status: 'IGNORED' };
    }

    // Firma válida
    const answer = JSON.parse(krAnswer as string) as IzipayAnswer;

    if (answer.orderStatus !== 'PAID') {
      return { status: 'IGNORED' };
    }

    const izipayOrderId = answer.orderDetails?.orderId;
    if (!izipayOrderId) {
      return { status: 'IGNORED' };
    }

    const payment = await this.paymentModel.findOne({ izipayOrderId });

    // LOG CRÍTICO: ¿contiene userId?
    this.logger.log('[IPN] Payment.orderDraft found:', payment?.orderDraft);

    if (!payment) {
      this.logger.warn(
        `⚠️ Payment not found for izipayOrderId=${izipayOrderId}`,
      );
      return { status: 'IGNORED' };
    }

    if (payment.status === PaymentStatus.PAID) {
      return { status: 'OK' };
    }

    // Crear orden final
    const order = await this.ordersService.create(
      {
        ...payment.orderDraft,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'IZIPAY',
      },
      payment.orderDraft?.userId,
    );

    await this.paymentModel.findByIdAndUpdate(payment._id, {
      status: PaymentStatus.PAID,
      orderId: order._id,
      transactionUuid: answer.transactions?.[0]?.uuid,
      rawResponse: answer,
    });

    if (payment.orderDraft?.userId) {
      await this.cartService.clearOpenCartByUserId(payment.orderDraft.userId);
    } else if (payment.orderDraft?.sessionId) {
      await this.cartService.clearOpenCartBySessionId(
        payment.orderDraft.sessionId,
      );
    }

    this.logger.log(
      `✅ Payment confirmado | paymentId=${payment._id.toString()} | orderId=${order._id.toString()}`,
    );

    return { status: 'OK' };
  }

  // --------------------------------------------------------------------
  // FORM TOKEN
  // --------------------------------------------------------------------
  async createFormToken(dto: CreatePaymentDto) {
    // LOG CRÍTICO: ¿llega userId al service?
    this.logger.log('[PaymentsService] dto.orderData received:', dto.orderData);

    const payment = await this.paymentModel.create({
      amount: dto.orderData.grandTotal,
      currency: dto.orderData.currency ?? 'PEN',
      status: PaymentStatus.PENDING,
      orderDraft: {
        ...dto.orderData,
        ...(dto.orderData.userId && { userId: dto.orderData.userId }),
      },
    });

    // LOG CONFIRMACIÓN: el payment guardado
    this.logger.log('[PaymentsService] Payment created:', {
      paymentId: payment._id.toString(),
      orderDraft: payment.orderDraft,
    });

    const izipayOrderId = payment._id.toString();

    const auth =
      'Basic ' +
      Buffer.from(
        `${process.env.IZIPAY_USERNAME}:${process.env.IZIPAY_PASSWORD}`,
      ).toString('base64');

    const response = await firstValueFrom(
      this.http.post<IzipayCreatePaymentResponse>(
        `${process.env.IZIPAY_BASE_URL}/V4/Charge/CreatePayment`,
        {
          amount: payment.amount * 100,
          currency: payment.currency,
          orderId: izipayOrderId,
          customer: { email: dto.orderData.customerEmail },
        },
        {
          headers: {
            Authorization: auth,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    if (response.data.status !== 'SUCCESS') {
      throw new BadRequestException('Izipay error');
    }

    await this.paymentModel.findByIdAndUpdate(payment._id, {
      izipayOrderId,
      formToken: response.data.answer.formToken,
    });

    return {
      formToken: response.data.answer.formToken,
      publicKey: process.env.IZIPAY_PUBLIC_KEY,
      paymentId: payment._id,
    };
  }
}
