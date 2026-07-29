import axios from 'axios';

const RAW_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

const NORMALIZED_API_URL = RAW_API_URL.replace(/\/+$/, '');

const API_URL = NORMALIZED_API_URL.endsWith('/api')
  ? NORMALIZED_API_URL
  : `${NORMALIZED_API_URL}/api`;

function getStoredToken() {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token')
  );
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthenticationRequest =
      error.config?.url?.includes('/auth/');

    if (
      error.response?.status === 401 &&
      !isAuthenticationRequest
    ) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }

    return Promise.reject(error);
  },
);