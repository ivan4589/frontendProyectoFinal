import { api } from './axios';
import type {
  CreateWarehouseTransferRequest,
  WarehouseTransfer,
} from '../types/warehouse-transfer.types';

export async function getWarehouseTransfers(): Promise<WarehouseTransfer[]> {
  const response = await api.get<WarehouseTransfer[]>('/warehouse-transfers');
  return Array.isArray(response.data) ? response.data : [];
}

export async function createWarehouseTransfer(
  data: CreateWarehouseTransferRequest,
): Promise<WarehouseTransfer> {
  const response = await api.post<WarehouseTransfer>(
    '/warehouse-transfers',
    data,
  );
  return response.data;
}

export async function cancelWarehouseTransfer(
  id: string,
  reason: string,
): Promise<WarehouseTransfer> {
  const response = await api.patch<WarehouseTransfer>(
    `/warehouse-transfers/${id}/cancel`,
    { reason },
  );
  return response.data;
}
