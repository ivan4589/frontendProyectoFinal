export type UserRole = 'ADMIN' | 'VENDEDOR' | 'COBRADOR';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: AuthUser;
}

export interface AuthUser {
  id?: number;
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface DecodedToken {
  sub?: number;
  id?: number;
  email?: string;
  name?: string;
  role?: UserRole;
  exp?: number;
  iat?: number;
}