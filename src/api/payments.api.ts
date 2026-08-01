import { api } from './axios';
import type { PaymentMethod } from '../types/sale.types';

export interface EconomicPayment {
  id: string;
  saleId: string;
  clientId: string;
  clientName: string;
  userId: number;
  userName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  observations?: string | null;
  isReversal: boolean;
  reversalOfId?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function getPayments(): Promise<EconomicPayment[]> {
  const response = await api.get<EconomicPayment[]>('/payments');
  return Array.isArray(response.data) ? response.data : [];
}

export async function reversePayment(id: string, reason: string) {
  const response = await api.patch<EconomicPayment>(
    `/payments/${id}/cancel`,
    { reason },
  );
  return response.data;
}
