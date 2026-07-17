import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loginRequest } from '../../api/auth.api';
import type { AuthUser, LoginRequest } from '../../types/auth.types';
import {
  clearToken,
  decodeToken,
  getToken,
  isTokenExpired,
  saveToken,
} from './authStorage';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest, remember: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialToken() {
  const token = getToken();

  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    clearToken();
    return null;
  }

  return token;
}

function getUserFromToken(token: string | null): AuthUser | null {
  if (!token) {
    return null;
  }

  const decoded = decodeToken(token);

  if (!decoded) {
    return null;
  }

  return {
    id: decoded.id || decoded.sub,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getInitialToken());

  const user = useMemo(() => getUserFromToken(token), [token]);

  const login = useCallback(async (data: LoginRequest, remember: boolean) => {
    const response = await loginRequest(data);

    const receivedToken =
      response.access_token || response.accessToken || response.token;

    if (!receivedToken) {
      throw new Error('El servidor no devolvió un token válido');
    }

    const decoded = decodeToken(receivedToken);

    if (!decoded) {
      throw new Error('El token recibido no es válido');
    }

    saveToken(receivedToken, remember);
    setToken(receivedToken);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}