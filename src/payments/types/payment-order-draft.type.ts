// src/payments/types/payment-order-draft.type.ts
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

export type PaymentOrderDraft = CreateOrderDto & {
  userId?: string;
  sessionId?: string;
};
