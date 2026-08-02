import { api } from './axios';
import type {
  CreateProviderRequest,
  Provider,
  UpdateProviderRequest,
} from '../types/provider.types';

function normalizeProvidersResponse(data: unknown): Provider[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'providers' in data && Array.isArray((data as { providers: unknown }).providers)) {
    return (data as { providers: Provider[] }).providers;
  }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: Provider[] }).data;
  }
  return [];
}

export async function getProviders(params?: { includeInactive?: boolean }): Promise<Provider[]> {
  const response = await api.get<unknown>('/providers', { params });
  return normalizeProvidersResponse(response.data);
}

export async function getProviderById(id: string): Promise<Provider> {
  const response = await api.get<Provider>(`/providers/${id}`);
  return response.data;
}

export async function createProvider(data: CreateProviderRequest): Promise<Provider> {
  const response = await api.post<Provider>('/providers', data);
  return response.data;
}

export async function updateProvider(id: string, data: UpdateProviderRequest): Promise<Provider> {
  const response = await api.patch<Provider>(`/providers/${id}`, data);
  return response.data;
}

export async function deactivateProvider(id: string, reason: string): Promise<Provider> {
  const response = await api.patch<Provider>(`/providers/${id}/deactivate`, { reason });
  return response.data;
}

export async function reactivateProvider(id: string, reason: string): Promise<Provider> {
  const response = await api.patch<Provider>(`/providers/${id}/reactivate`, { reason });
  return response.data;
}
