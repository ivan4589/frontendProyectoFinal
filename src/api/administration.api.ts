import { api } from './axios';
import type {
  AdminConfirmation,
  CreateSystemUserRequest,
  CreateSystemUserResponse,
  ManagedUserSession,
  SystemUser,
  TemporaryPasswordResponse,
  UpdateSystemUserRequest,
  UserAdministrationLog,
  UserSecurityAuditLog,
} from '../types/administration.types';

export async function getSystemUsers(): Promise<SystemUser[]> {
  const response = await api.get<SystemUser[]>('/users');
  return response.data;
}

export async function getSystemUser(id: number): Promise<SystemUser> {
  const response = await api.get<SystemUser>(`/users/${id}`);
  return response.data;
}

export async function createSystemUser(
  data: CreateSystemUserRequest,
): Promise<CreateSystemUserResponse> {
  const response = await api.post<CreateSystemUserResponse>('/users', data);
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
  confirmation: AdminConfirmation,
): Promise<SystemUser> {
  const response = await api.patch<SystemUser>(`/users/${id}/status`, {
    isActive,
    confirmation,
  });
  return response.data;
}

export async function resetSystemUserPassword(
  id: number,
  confirmation: AdminConfirmation,
): Promise<TemporaryPasswordResponse> {
  const response = await api.patch<TemporaryPasswordResponse>(
    `/users/${id}/password`,
    { confirmation },
  );
  return response.data;
}

export async function unlockSystemUser(
  id: number,
  confirmation: AdminConfirmation,
): Promise<SystemUser> {
  const response = await api.post<SystemUser>(`/users/${id}/unlock`, confirmation);
  return response.data;
}

export async function resetSystemUserTwoFactor(
  id: number,
  confirmation: AdminConfirmation,
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    `/users/${id}/reset-2fa`,
    confirmation,
  );
  return response.data;
}

export async function revokeSystemUserSessions(
  id: number,
  confirmation: AdminConfirmation,
): Promise<{ message: string; revokedSessions: number }> {
  const response = await api.post<{
    message: string;
    revokedSessions: number;
  }>(`/users/${id}/revoke-sessions`, confirmation);
  return response.data;
}

export async function getSystemUserSessions(
  id: number,
): Promise<ManagedUserSession[]> {
  const response = await api.get<ManagedUserSession[]>(`/users/${id}/sessions`);
  return response.data;
}

export async function getUserAdministrationLog(): Promise<
  UserAdministrationLog[]
> {
  const response = await api.get<UserAdministrationLog[]>('/users/audit');
  return response.data;
}

export async function getUserSecurityAuditLog(
  targetUserId?: number,
): Promise<UserSecurityAuditLog[]> {
  const response = await api.get<UserSecurityAuditLog[]>(
    '/users/security-audit',
    { params: targetUserId ? { targetUserId } : undefined },
  );
  return response.data;
}
