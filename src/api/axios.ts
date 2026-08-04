import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { clearToken, getToken, saveToken } from '../features/auth/authStorage';
import type { LoginResponse } from '../types/auth.types';
import { environment } from '../config/environment';
import { reportClientError } from '../monitoring/reportError';

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const refreshClient = axios.create({
  baseURL: environment.apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const api = axios.create({
  baseURL: environment.apiUrl,
  timeout: 30_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

function responseToken(response: LoginResponse) {
  return response.access_token || response.accessToken || response.token;
}

function createOperationKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function requiresIdempotency(config: InternalAxiosRequestConfig) {
  const method = (config.method || 'get').toLowerCase();
  const path = (config.url || '').split('?')[0];

  if (!['post', 'patch', 'delete'].includes(method)) {
    return false;
  }

  return [
    '/sales',
    '/payments',
    '/purchases',
    '/warehouse-transfers',
    '/collections/sales',
    '/inventory/adjustments',
  ].some((prefix) => path.startsWith(prefix));
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
  if (!config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = createOperationKey();
  }

  if (requiresIdempotency(config) && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = createOperationKey();
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    if (!error.response || error.response.status >= 500) {
      reportClientError(error, {
        source: 'axios',
        requestId: String(error.response?.headers['x-request-id'] || ''),
        status: error.response?.status,
        method: request?.method?.toUpperCase(),
        path: request?.url?.split('?')[0],
      });
    }
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
