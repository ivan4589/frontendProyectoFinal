import { api } from './axios';
import type {
  CollectionAssignableUser,
  CollectionDebtsResponse,
  CollectionPdfResponse,
  CreateCollectionPaymentRequest,
} from '../types/collection.types';

export async function getCollectionDebts() {
  const response = await api.get<CollectionDebtsResponse>('/collections/debts');
  return response.data;
}

export async function getCollectionAssignableUsers() {
  const response = await api.get<CollectionAssignableUser[]>(
    '/collections/assignable-users',
  );
  return response.data;
}

export async function assignCollection(saleId: string, assignedToId: number) {
  const response = await api.patch(
    `/collections/sales/${saleId}/assignment`,
    { assignedToId },
  );
  return response.data;
}

export async function unassignCollection(saleId: string, reason: string) {
  const response = await api.patch(
    `/collections/sales/${saleId}/assignment/remove`,
    { reason },
  );
  return response.data;
}

export async function createCollectionPayment(
  data: CreateCollectionPaymentRequest,
) {
  const response = await api.post('/payments', data);
  return response.data;
}

export async function generateGeneralDebtPdf() {
  const response = await api.post<CollectionPdfResponse>(
    '/collections/reports/general-pdf',
  );
  return response.data;
}

export async function generateAssignmentsPdf() {
  const response = await api.post<CollectionPdfResponse>(
    '/collections/reports/assignments-pdf',
  );
  return response.data;
}

export async function generateUserAssignmentsPdf(userId: number) {
  const response = await api.post<CollectionPdfResponse>(
    `/collections/reports/users/${userId}/pdf`,
  );
  return response.data;
}
