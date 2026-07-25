import { api } from './axios';
import type {
  CreateSystemUserRequest,
  SystemUser,
  UpdateSystemUserRequest,
  UserAdministrationLog,
} from '../types/administration.types';

export async function getSystemUsers(): Promise<SystemUser[]> {
  const response = await api.get<SystemUser[]>('/users');
  return response.data;
}

export async function createSystemUser(
  data: CreateSystemUserRequest,
): Promise<SystemUser> {
  const response = await api.post<SystemUser>('/users', data);
  return response.data;
}

export async function updateSystemUser(
  id: number,
  data: UpdateSystemUserRequest,
): Promise<SystemUser> {
  const response = await api.patch<SystemUser>(`/users/${id}`, data);
  return response.data;
}

export async function updateSystemUserStatus(
  id: number,
  isActive: boolean,
): Promise<SystemUser> {
  const response = await api.patch<SystemUser>(`/users/${id}/status`, {
    isActive,
  });
  return response.data;
}

export async function resetSystemUserPassword(
  id: number,
  password: string,
): Promise<{ message: string }> {
  const response = await api.patch<{ message: string }>(
    `/users/${id}/password`,
    { password },
  );
  return response.data;
}

export async function getUserAdministrationLog(): Promise<
  UserAdministrationLog[]
> {
  const response = await api.get<UserAdministrationLog[]>('/users/audit');
  return response.data;
}
