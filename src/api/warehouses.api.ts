import { api } from './axios';
import type { Warehouse } from '../types/warehouse.types';

export async function getWarehouses(): Promise<
  Warehouse[]
> {
  const response =
    await api.get<Warehouse[]>('/warehouses');

  return Array.isArray(response.data) ? response.data : [];
}
