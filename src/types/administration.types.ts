import type { UserRole } from './auth.types';

export type UserSecurityStatus =
  | 'PENDING_EMAIL_VERIFICATION'
  | 'PENDING_ADMIN_APPROVAL'
  | 'ACTIVE'
  | 'REJECTED'
  | 'TEMPORARILY_LOCKED'
  | 'DISABLED';

export interface AdminConfirmation {
  password: string;
  code: string;
  reason: string;
}

export interface SystemUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  requestedRole: UserRole | null;
  status: UserSecurityStatus;
  isActive: boolean;
  emailVerifiedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorVerifiedAt: string | null;
  lastLoginAt: string | null;
  activeSessions: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateSystemUserRequest {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  confirmation: AdminConfirmation;
}

export interface CreateSystemUserResponse {
  user: SystemUser;
  temporaryPassword: string;
  message: string;
}

export interface UpdateSystemUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  confirmation?: AdminConfirmation;
}

export interface TemporaryPasswordResponse {
  message: string;
  temporaryPassword: string;
}

export interface ManagedUserSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
}

export type UserAdministrationAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_REMOVED'
  | 'ROLE_CHANGED'
  | 'STATUS_CHANGED'
  | 'PASSWORD_RESET';

export interface UserAdministrationLog {
  id: string;
  action: UserAdministrationAction;
  details?: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: number;
    name: string;
    email: string;
  };
  targetUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface UserSecurityAuditLog {
  id: string;
  action: string;
  success: boolean;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  actorUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
  targetUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
}
