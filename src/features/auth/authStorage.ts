import type { DecodedToken } from '../../types/auth.types';

const TOKEN_KEY = 'access_token';
let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function saveToken(token: string) {
  accessToken = token;
  removeLegacyTokens();
  notify();
}

export function getToken() {
  return accessToken;
}

export function clearToken() {
  accessToken = null;
  removeLegacyTokens();
  notify();
}

export function subscribeToken(listener: (token: string | null) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener(accessToken));
}

function removeLegacyTokens() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const jsonPayload = decodeURIComponent(
      window
        .atob(padded)
        .split('')
        .map(
          (char) =>
            `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`,
        )
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  if (!decoded.exp) return false;
  return decoded.exp * 1000 <= Date.now();
}
