import { api } from './axios';
import type {
  CreateLocationRequest,
  Location,
  UpdateLocationRequest,
} from '../types/client.types';

function normalizeLocationsResponse(data: unknown): Location[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === 'object' &&
    'locations' in data &&
    Array.isArray((data as { locations: unknown }).locations)
  ) {
    return (data as { locations: Location[] }).locations;
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Location[] }).data;
  }

  return [];
}

export async function getLocations(): Promise<Location[]> {
  const response = await api.get<unknown>('/locations');
  return normalizeLocationsResponse(response.data);
}

export async function createLocation(
  data: CreateLocationRequest,
): Promise<Location> {
  const response = await api.post<Location>('/locations', data);
  return response.data;
}

export async function updateLocation(
  id: string,
  data: UpdateLocationRequest,
): Promise<Location> {
  const response = await api.patch<Location>(`/locations/${id}`, data);
  return response.data;
}

export async function deleteLocation(id: string): Promise<void> {
  await api.delete(`/locations/${id}`);
}