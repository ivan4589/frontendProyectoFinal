import type { DecodedToken } from '../../types/auth.types';

const TOKEN_KEY = 'access_token';

export function saveToken(token: string, remember: boolean) {
  clearToken();

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((char) => {
          return `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`;
        })
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const decoded = decodeToken(token);

  if (!decoded?.exp) {
    return false;
  }

  return decoded.exp * 1000 < Date.now();
}