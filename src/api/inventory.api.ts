import { api } from './axios';
import type {
  AdjustInventoryRequest,
  AdjustInventoryResponse,
  CentralInventoryResponse,
  InventoryPdfResponse,
} from '../types/inventory.types';

export async function getCentralInventory() {
  const response = await api.get<CentralInventoryResponse>('/inventory');
  return response.data;
}

export async function adjustInventory(data: AdjustInventoryRequest) {
  const response = await api.post<AdjustInventoryResponse>(
    '/inventory/adjustments',
    data,
  );
  return response.data;
}

export async function generateCentralInventoryPdf() {
  const response = await api.post<InventoryPdfResponse>('/inventory/pdf');
  return response.data;
}
