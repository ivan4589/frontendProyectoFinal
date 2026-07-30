import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { clearToken, getToken, saveToken } from '../features/auth/authStorage';
import type { LoginResponse } from '../types/auth.types';

const RAW_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';
const NORMALIZED_API_URL = RAW_API_URL.replace(/\/+$/, '');
const API_URL = NORMALIZED_API_URL.endsWith('/api')
  ? NORMALIZED_API_URL
  : `${NORMALIZED_API_URL}/api`;

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

function responseToken(response: LoginResponse) {
  return response.access_token || response.accessToken || response.token;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<LoginResponse>('/auth/refresh', {})
      .then((response) => {
        const token = responseToken(response.data);
        if (!token) throw new Error('El servidor no renovó la sesión');
        saveToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function mustNotRefresh(url?: string) {
  const path = (url || '').split('?')[0];
  return [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/auth/resend-verification',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
    '/auth/logout',
    '/auth/2fa/setup',
    '/auth/2fa/confirm',
    '/auth/2fa/verify',
    '/auth/2fa/recovery',
  ].includes(path);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      mustNotRefresh(request.url)
    ) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return api.request(request);
    } catch (refreshError) {
      clearToken();
      return Promise.reject(refreshError);
    }
  },
);

export async function restoreSession() {
  try {
    return await refreshAccessToken();
  } catch {
    clearToken();
    return null;
  }
}
