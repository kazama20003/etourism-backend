// src/payments/types/izipay-ipn.type.ts
export interface IzipayTransaction {
  uuid: string;
}

export interface IzipayOrderDetails {
  orderId: string;
}

export interface IzipayAnswer {
  orderStatus: 'PAID' | 'UNPAID';
  orderDetails: IzipayOrderDetails;
  transactions: IzipayTransaction[];
}

export interface IzipayIpnPayload {
  'kr-answer': string;
  'kr-hash': string;
}
