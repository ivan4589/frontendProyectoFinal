import { api } from './axios';
import type {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
} from '../types/client.types';

function normalizeClientsResponse(data: unknown): Client[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'clients' in data && Array.isArray((data as { clients: unknown }).clients)) {
    return (data as { clients: Client[] }).clients;
  }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: Client[] }).data;
  }
  return [];
}

export async function getClients(params?: {
  locationId?: string;
  type?: string;
  includeInactive?: boolean;
}): Promise<Client[]> {
  const response = await api.get<unknown>('/clients', { params });
  return normalizeClientsResponse(response.data);
}

export async function getClientById(id: string): Promise<Client> {
  const response = await api.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function createClient(data: CreateClientRequest): Promise<Client> {
  const response = await api.post<Client>('/clients', data);
  return response.data;
}

export async function updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
  const response = await api.patch<Client>(`/clients/${id}`, data);
  return response.data;
}

export async function deactivateClient(id: string, reason: string): Promise<Client> {
  const response = await api.patch<Client>(`/clients/${id}/deactivate`, { reason });
  return response.data;
}

export async function reactivateClient(id: string, reason: string): Promise<Client> {
  const response = await api.patch<Client>(`/clients/${id}/reactivate`, { reason });
  return response.data;
}
