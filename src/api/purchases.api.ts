import { api } from './axios';
import type {
  CreatePurchaseRequest,
  Purchase,
  PurchaseStatus,
  UpdatePurchaseRequest,
} from '../types/purchase.types';

function normalizePurchases(data: unknown): Purchase[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Purchase[] }).data;
  }

  if (
    data &&
    typeof data === 'object' &&
    'purchases' in data &&
    Array.isArray((data as { purchases: unknown }).purchases)
  ) {
    return (data as { purchases: Purchase[] }).purchases;
  }

  return [];
}

export async function getPurchases(params?: {
  status?: PurchaseStatus | 'ALL';
  providerId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Purchase[]> {
  const response = await api.get<unknown>('/purchases', {
    params: {
      status: params?.status === 'ALL' ? undefined : params?.status,
      providerId: params?.providerId === 'ALL' ? undefined : params?.providerId,
      dateFrom: params?.dateFrom || undefined,
      dateTo: params?.dateTo || undefined,
    },
  });

  return normalizePurchases(response.data);
}

export async function createPurchase(
  data: CreatePurchaseRequest,
): Promise<Purchase> {
  const response = await api.post<Purchase>('/purchases', data);
  return response.data;
}

export async function updatePurchase(
  id: string,
  data: UpdatePurchaseRequest,
): Promise<Purchase> {
  const response = await api.patch<Purchase>(`/purchases/${id}`, data);
  return response.data;
}

export async function receivePurchaseProvider(
  purchaseId: string,
  purchaseProviderId: string,
): Promise<Purchase> {
  const response = await api.patch<Purchase>(
    `/purchases/${purchaseId}/providers/${purchaseProviderId}/receive`,
    {},
  );
  return response.data;
}

export async function cancelPurchaseProvider(
  purchaseId: string,
  purchaseProviderId: string,
  reason: string,
): Promise<Purchase> {
  const response = await api.patch<Purchase>(
    `/purchases/${purchaseId}/providers/${purchaseProviderId}/cancel`,
    { reason },
  );
  return response.data;
}

export async function cancelPurchase(
  purchaseId: string,
  reason: string,
): Promise<Purchase> {
  const response = await api.patch<Purchase>(
    `/purchases/${purchaseId}/cancel`,
    { reason },
  );
  return response.data;
}
