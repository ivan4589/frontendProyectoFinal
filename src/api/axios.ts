import axios from 'axios';

<<<<<<< HEAD
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';
=======
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
>>>>>>> 4eebe2afc34ddb8970276664535f86446b978801

function getStoredToken() {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token')
  );
}

export const api = axios.create({
<<<<<<< HEAD
  baseURL: `${API_URL.replace(/\/$/, '')}/api`,
=======
  baseURL: API_URL,
  withCredentials: true,
>>>>>>> 4eebe2afc34ddb8970276664535f86446b978801
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  },
);
