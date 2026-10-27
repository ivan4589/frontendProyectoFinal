import { api } from './axios';
import type {
  CreateSaleRequest,
  CreateSaleReturnRequest,
  PaymentStatus,
  Sale,
  SaleReturnResponse,
  SaleStatus,
  SendSaleWhatsAppResponse,
  UpdateSaleRequest,
} from '../types/sale.types';

function normalizeSalesResponse(data: unknown): Sale[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === 'object' &&
    'sales' in data &&
    Array.isArray((data as { sales: unknown }).sales)
  ) {
    return (data as { sales: Sale[] }).sales;
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Sale[] }).data;
  }

  return [];
}

export async function getSales(params?: {
  status?: SaleStatus | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Sale[]> {
  const response = await api.get<unknown>('/sales', {
    params: {
      status: params?.status === 'ALL' ? undefined : params?.status,
      paymentStatus:
        params?.paymentStatus === 'ALL' ? undefined : params?.paymentStatus,
      clientId: params?.clientId === 'ALL' ? undefined : params?.clientId,
      dateFrom: params?.dateFrom || undefined,
      dateTo: params?.dateTo || undefined,
    },
  });

  return normalizeSalesResponse(response.data);
}

export async function getSaleById(id: string): Promise<Sale> {
  const response = await api.get<Sale>(`/sales/${id}`);
  return response.data;
}

export async function createSale(data: CreateSaleRequest): Promise<Sale> {
  const response = await api.post<Sale>('/sales', data);
  return response.data;
}

export async function updateSale(
  id: string,
  data: UpdateSaleRequest,
): Promise<Sale> {
  const response = await api.patch<Sale>(`/sales/${id}`, data);
  return response.data;
}

export async function confirmSale(id: string): Promise<Sale> {
  const response = await api.patch<Sale>(`/sales/${id}/confirm`, {});
  return response.data;
}

export async function cancelSale(id: string, reason: string): Promise<Sale> {
  const response = await api.patch<Sale>(`/sales/${id}/cancel`, { reason });
  return response.data;
}

export async function createSaleReturn(
  saleId: string,
  data: CreateSaleReturnRequest,
): Promise<SaleReturnResponse> {
  const response = await api.post<SaleReturnResponse>(
    `/sales/${saleId}/returns`,
    data,
  );
  return response.data;
}

export async function sendSaleWhatsApp(
  saleId: string,
  resend = false,
): Promise<SendSaleWhatsAppResponse> {
  const response = await api.post<SendSaleWhatsAppResponse>(
    `/sales/${saleId}/whatsapp`,
    { resend },
  );
  return response.data;
}

export interface WhatsAppLog {
  id: string;
  phoneNumber: string;
  status: import('../types/sale.types').WhatsAppSendStatus;
  createdAt: string;
  errorMessage?: string | null;
}
export interface RecipientResult {
  recipient: string;
  status: 'SENT' | 'FAILED';
  phoneNumber?: string;
  error?: string;
}
export async function getSaleWhatsAppLogs(saleId: string): Promise<WhatsAppLog[]> {
  return (await api.get(`/sales/${saleId}/whatsapp/logs`)).data;
}
export async function sendSaleWhatsAppRecipient(saleId: string, recipient: string, resend: boolean): Promise<RecipientResult> {
  const response = await api.post<{ results: RecipientResult[] }>(`/sales/${saleId}/whatsapp/recipients`, { recipients: [recipient], resend });
  if (!response.data.results?.[0]) throw new Error('El servidor no devolvió el resultado del envío');
  return response.data.results[0];
}
