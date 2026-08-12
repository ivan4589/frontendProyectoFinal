import type { ClientType } from './client.types';

export type SaleStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type SaleType = 'CASH' | 'CREDIT';
export type PaymentMethod = 'CASH' | 'QR' | 'BANK_TRANSFER';
export type WhatsAppSendStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface SaleDetail {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string | null;
  presentation?: string | null;
  quantity: number;
  returnedQuantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  clientId: string;
  clientName: string;
  clientAlias?: string | null;
  clientType: ClientType;
  clientLocation?: string | null;
  clientPhone?: string | null;
  clientWhatsAppConsent: boolean;
  userId: number;
  userName: string;
  date: string;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  saleType: SaleType;
  dueDate?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  observations?: string | null;
  pdfUrl?: string | null;
  cancelledPdfUrl?: string | null;
  whatsappLastSentAt?: string | null;
  whatsappMessageId?: string | null;
  whatsappStatus?: WhatsAppSendStatus | null;
  whatsappLastError?: string | null;
  details: SaleDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleDetailRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleRequest {
  clientId: string;
  details: SaleDetailRequest[];
  discount?: number;
  observations?: string;
  saleType: SaleType;
  dueDate?: string;
  initialPayment?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
}

export interface UpdateSaleRequest {
  clientId?: string;
  details?: SaleDetailRequest[];
  discount?: number;
  observations?: string;
  saleType?: SaleType;
  dueDate?: string;
}

export interface SaleReturnDetailRequest {
  saleDetailId: string;
  quantity: number;
}

export interface CreateSaleReturnRequest {
  details: SaleReturnDetailRequest[];
  observations: string;
}

export interface SaleReturnResponse {
  message: string;
  return: {
    id: string;
    saleId: string;
    userId?: number;
    amount: number;
    observations?: string | null;
    createdAt?: string;
  };
  sale: Sale;
}

export interface SendSaleWhatsAppResponse {
  saleId: string;
  status: 'SENT';
  phoneNumber: string;
  messageId: string;
  sentAt: string;
}
