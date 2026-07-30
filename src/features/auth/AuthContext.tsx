import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { restoreSession } from '../../api/axios';
import { loginRequest, logoutRequest } from '../../api/auth.api';
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from '../../types/auth.types';
import {
  clearToken,
  decodeToken,
  getToken,
  saveToken,
  subscribeToken,
} from './authStorage';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (data: LoginRequest, remember: boolean) => Promise<LoginResponse>;
  completeLogin: (response: LoginResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
  const [token, setToken] = useState<string | null>(() => getToken());
  const [initializing, setInitializing] = useState(true);
  const user = useMemo(() => getUserFromToken(token), [token]);

  useEffect(() => {
    const unsubscribe = subscribeToken(setToken);
    restoreSession().finally(() => setInitializing(false));
    return unsubscribe;
  }, []);

  const completeLogin = useCallback((response: LoginResponse) => {
    const receivedToken = responseToken(response);
    if (!receivedToken || !decodeToken(receivedToken)) {
      throw new Error('El servidor no devolvió una sesión válida');
    }
    saveToken(receivedToken);
  }, []);

  const login = useCallback(
    async (data: LoginRequest, _remember: boolean) => {
      const response = await loginRequest(data);
      if (responseToken(response)) completeLogin(response);
      return response;
    },
    [completeLogin],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearToken();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      initializing,
      login,
      completeLogin,
      logout,
    }),
    [token, user, initializing, login, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
