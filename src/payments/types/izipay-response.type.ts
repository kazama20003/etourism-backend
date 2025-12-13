// src/payments/types/izipay-response.type.ts
export interface IzipayCreatePaymentAnswer {
  formToken: string;
}

export interface IzipayCreatePaymentResponse {
  status: 'SUCCESS' | 'FAILURE';
  answer: IzipayCreatePaymentAnswer;
}
