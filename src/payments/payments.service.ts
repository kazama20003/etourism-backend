// src/payments/payments.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import type { IzipayCreatePaymentResponse } from './types/izipay-response.type';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus, OrderStatus } from '../orders/entities/order.entity';
import { IzipayIpnPayload, IzipayAnswer } from './types/izipay-ipn.type';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly ordersService: OrdersService,
    private readonly http: HttpService,
    private readonly mailService: MailService, // 👈 FALTA
  ) {}

  // ─────────────────────────────────────
  // 🔐 VALIDAR FIRMA
  // ─────────────────────────────────────
  private checkHash(payload: IzipayIpnPayload, key: string): boolean {
    const calculated = crypto
      .createHmac('sha256', key)
      .update(payload['kr-answer'])
      .digest('hex');

    return calculated === payload['kr-hash'];
  }

  // ─────────────────────────────────────
  // 🔔 IPN HANDLER
  // ─────────────────────────────────────
  async handleIpn(payload: IzipayIpnPayload) {
    if (!payload?.['kr-answer']) {
      throw new BadRequestException('Empty IPN body');
    }

    if (!this.checkHash(payload, process.env.IZIPAY_PASSWORD!)) {
      throw new BadRequestException('Invalid Izipay signature');
    }

    const parsed = JSON.parse(payload['kr-answer']) as unknown;

    const answer = parsed as IzipayAnswer;

    const { orderStatus, orderDetails, transactions } = answer;

    if (!orderDetails?.orderId) {
      throw new BadRequestException('OrderId missing');
    }

    if (orderStatus === 'PAID') {
      const order = await this.ordersService.findOne(orderDetails.orderId);

      // 🔒 Evita reprocesar IPN
      if (order.paymentStatus === PaymentStatus.PAID) {
        return { status: 'OK' };
      }

      await this.paymentModel.findOneAndUpdate(
        { orderId: orderDetails.orderId },
        {
          status: PaymentStatus.PAID,
          transactionUuid: transactions[0]?.uuid,
          rawResponse: answer,
        },
      );

      const updatedOrder = await this.ordersService.update(
        orderDetails.orderId,
        {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
      );

      await this.mailService.sendPaymentConfirmation({
        to: updatedOrder.customerEmail,
        customerName: updatedOrder.customerName,
        orderId: updatedOrder._id.toString(),
        confirmationCode: updatedOrder.confirmationCode!,
        total: updatedOrder.grandTotal,
        currency: updatedOrder.currency,
      });
    }

    return { status: 'OK' };
  }

  // ─────────────────────────────────────
  // 💳 FORM TOKEN
  // ─────────────────────────────────────
  async createFormToken(dto: CreatePaymentDto) {
    const order = await this.ordersService.create({
      ...dto.orderData,
      paymentMethod: 'IZIPAY',
    });

    await this.paymentModel.create({
      orderId: order._id,
      amount: order.grandTotal,
      currency: order.currency,
      status: PaymentStatus.PENDING,
    });

    const auth =
      'Basic ' +
      Buffer.from(
        `${process.env.IZIPAY_USERNAME}:${process.env.IZIPAY_PASSWORD}`,
      ).toString('base64');

    // 4️⃣ Crear pago Izipay
    const response = await firstValueFrom(
      this.http.post<IzipayCreatePaymentResponse>(
        `${process.env.IZIPAY_BASE_URL}/V4/Charge/CreatePayment`,
        {
          amount: order.grandTotal * 100,
          currency: order.currency,
          orderId: order._id.toString(),
          customer: { email: order.customerEmail },
        },
        {
          headers: {
            Authorization: auth,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    // ✅ response.data ahora está tipado
    if (response.data.status !== 'SUCCESS') {
      throw new BadRequestException('Izipay error');
    }

    return {
      formToken: response.data.answer.formToken,
      publicKey: process.env.IZIPAY_PUBLIC_KEY,
      orderId: order._id,
    };
  }
}
