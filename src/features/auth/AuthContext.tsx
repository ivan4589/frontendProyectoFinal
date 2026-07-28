import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loginRequest } from '../../api/auth.api';
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from '../../types/auth.types';
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
  login: (data: LoginRequest, remember: boolean) => Promise<LoginResponse>;
  completeLogin: (response: LoginResponse, remember: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialToken() {
  const token = getToken();
  if (!token) return null;
  if (isTokenExpired(token)) {
    clearToken();
    return null;
  }
  return token;
}

function getUserFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    id: decoded.id || decoded.sub,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
  };
}

function responseToken(response: LoginResponse) {
  return response.access_token || response.accessToken || response.token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const user = useMemo(() => getUserFromToken(token), [token]);

  const completeLogin = useCallback(
    (response: LoginResponse, remember: boolean) => {
      const receivedToken = responseToken(response);
      if (!receivedToken || !decodeToken(receivedToken)) {
        throw new Error('El servidor no devolvió una sesión válida');
      }
      saveToken(receivedToken, remember);
      setToken(receivedToken);
    },
    [],
  );

  const login = useCallback(
    async (data: LoginRequest, remember: boolean) => {
      const response = await loginRequest(data);
      if (responseToken(response)) completeLogin(response, remember);
      return response;
    },
    [completeLogin],
  );

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
      completeLogin,
      logout,
    }),
    [token, user, login, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
