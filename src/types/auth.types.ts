export type UserRole = 'ADMIN' | 'VENDEDOR' | 'COBRADOR';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id?: number;
  name?: string;
  email?: string;
  role?: UserRole;
  status?: string;
  twoFactorEnabled?: boolean;
  mustChangePassword?: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: AuthUser;
  requiresTwoFactor?: boolean;
  requiresTwoFactorSetup?: boolean;
  challengeToken?: string;
  recoveryCodes?: string[];
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  requestedRole: 'VENDEDOR' | 'COBRADOR';
  password: string;
}

export interface RegistrationRequest {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  requestedRole: 'VENDEDOR' | 'COBRADOR';
  status: 'PENDING_EMAIL_VERIFICATION' | 'PENDING_ADMIN_APPROVAL';
  emailVerifiedAt?: string | null;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName: string;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
  current: boolean;
}

export interface DecodedToken {
  sub?: number;
  id?: number;
  sid?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  securityVersion?: number;
  mustChangePassword?: boolean;
  exp?: number;
  iat?: number;
}
