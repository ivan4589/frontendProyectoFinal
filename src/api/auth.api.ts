import { api } from './axios';
import type {
  AuthSession,
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegistrationRequest,
  UserRole,
} from '../types/auth.types';

export async function loginRequest(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function registerRequest(data: RegisterRequest) {
  const response = await api.post('/auth/register', data);
  return response.data;
}

export async function verifyEmailRequest(token: string) {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
}

export async function resendVerificationRequest(email: string) {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
}

export async function forgotPasswordRequest(email: string) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPasswordRequest(token: string, newPassword: string) {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
}

export async function startTwoFactorSetup(token: string) {
  const response = await api.post<{ secret: string; otpauthUrl: string }>(
    '/auth/2fa/setup',
    { token },
  );
  return response.data;
}

export async function confirmTwoFactor(
  challengeToken: string,
  code: string,
  remember = false,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/2fa/confirm', {
    challengeToken,
    code,
    remember,
  });
  return response.data;
}

export async function verifyTwoFactor(
  challengeToken: string,
  code: string,
  remember = false,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/2fa/verify', {
    challengeToken,
    code,
    remember,
  });
  return response.data;
}

export async function useRecoveryCode(
  challengeToken: string,
  recoveryCode: string,
  remember = false,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/2fa/recovery', {
    challengeToken,
    recoveryCode,
    remember,
  });
  return response.data;
}

export async function logoutRequest() {
  const response = await api.post('/auth/logout', {});
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<AuthUser>('/auth/me');
  return response.data;
}

export async function getSessions() {
  const response = await api.get<AuthSession[]>('/auth/sessions');
  return response.data;
}

export async function revokeSession(id: string) {
  const response = await api.delete(`/auth/sessions/${id}`);
  return response.data as {
    message: string;
    currentSessionRevoked: boolean;
  };
}

export async function logoutAllSessions() {
  const response = await api.post('/auth/logout-all', {});
  return response.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  const response = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function regenerateRecoveryCodes(password: string, code: string) {
  const response = await api.post<{
    message: string;
    recoveryCodes: string[];
  }>('/auth/2fa/recovery-codes/regenerate', { password, code });
  return response.data;
}

export async function getRegistrationRequests() {
  const response = await api.get<RegistrationRequest[]>(
    '/auth/admin/registration-requests',
  );
  return response.data;
}

export async function approveRegistration(id: number, role: UserRole) {
  const response = await api.patch(
    `/auth/admin/registration-requests/${id}/approve`,
    { role },
  );
  return response.data;
}

export async function rejectRegistration(id: number, reason: string) {
  const response = await api.patch(
    `/auth/admin/registration-requests/${id}/reject`,
    { reason },
  );
  return response.data;
}

export async function resetUserTwoFactor(id: number) {
  const response = await api.post(`/auth/admin/users/${id}/reset-2fa`);
  return response.data;
}
