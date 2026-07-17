import { api } from './axios';
import type {
  CreateProviderRequest,
  Provider,
  UpdateProviderRequest,
} from '../types/provider.types';

export async function getProviders(): Promise<Provider[]> {
  const response = await api.get<Provider[]>('/providers');
  return response.data;
}

export async function getProviderById(id: string): Promise<Provider> {
  const response = await api.get<Provider>(`/providers/${id}`);
  return response.data;
}

export async function createProvider(
  data: CreateProviderRequest,
): Promise<Provider> {
  const response = await api.post<Provider>('/providers', data);
  return response.data;
}

export async function updateProvider(
  id: string,
  data: UpdateProviderRequest,
): Promise<Provider> {
  const response = await api.patch<Provider>(`/providers/${id}`, data);
  return response.data;
}

export async function deleteProvider(id: string): Promise<void> {
  await api.delete(`/providers/${id}`);
}