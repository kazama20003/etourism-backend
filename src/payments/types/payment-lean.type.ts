import { LeanDoc } from 'src/common/types/lean-doc.type';

export interface LeanPaymentItem {
  productType: string;
  productId: string;
  travelDate: Date;
  totalPrice: number;
}

export interface LeanPaymentDraft {
  customerName: string;
  customerEmail: string;
  items: LeanPaymentItem[];
}

export interface LeanPayment extends LeanDoc {
  amount: number;
  currency: string;
  status: string;
  orderId?: string;
  izipayOrderId?: string;
  transactionUuid?: string;
  orderDraft?: LeanPaymentDraft;
}
