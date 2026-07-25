import type { UserRole } from './auth.types';

export interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateSystemUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
}

export type UserAdministrationAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
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
