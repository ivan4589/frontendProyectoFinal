import { api } from './axios';
import type {
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
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/2fa/confirm', {
    challengeToken,
    code,
  });
  return response.data;
}

export async function verifyTwoFactor(
  challengeToken: string,
  code: string,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/2fa/verify', {
    challengeToken,
    code,
  });
  return response.data;
}

export async function useRecoveryCode(
  challengeToken: string,
  recoveryCode: string,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/2fa/recovery', {
    challengeToken,
    recoveryCode,
  });
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
