import { LeanDoc } from './lean-doc.type';

export interface LeanOrderItem {
  productType: 'Tour' | 'Transport';
  productId: string;
  travelDate: Date;
  totalPrice: number;
}

export interface LeanOrder extends LeanDoc {
  customerName: string;
  customerEmail: string;
  currency: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  items: LeanOrderItem[];
}
