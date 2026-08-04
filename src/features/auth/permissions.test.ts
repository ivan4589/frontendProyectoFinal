import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission, PERMISSIONS, ROLE_PERMISSIONS } from './permissions';

describe('matriz de permisos del frontend', () => {
  it('mantiene identificadores únicos y otorga todos al administrador', () => {
    const permissions = Object.values(PERMISSIONS);
    expect(new Set(permissions).size).toBe(permissions.length);
    expect(permissions.every((permission) => hasPermission('ADMIN', permission))).toBe(true);
  });

  it('impide administrar usuarios y configuración a roles operativos', () => {
    for (const role of ['VENDEDOR', 'COBRADOR'] as const) {
      expect(hasPermission(role, PERMISSIONS.USERS_MANAGE)).toBe(false);
      expect(hasPermission(role, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
      expect(hasPermission(role, PERMISSIONS.AUDIT_VIEW)).toBe(false);
    }
  });

  it('separa las capacidades económicas de vendedor y cobrador', () => {
    expect(hasPermission('VENDEDOR', PERMISSIONS.SALES_CREATE)).toBe(true);
    expect(hasPermission('VENDEDOR', PERMISSIONS.PAYMENTS_CREATE_ASSIGNED)).toBe(false);
    expect(
      hasAnyPermission('COBRADOR', [
        PERMISSIONS.PAYMENTS_CREATE_ASSIGNED,
        PERMISSIONS.COLLECTIONS_VIEW_ASSIGNED,
      ]),
    ).toBe(true);
    expect(ROLE_PERMISSIONS.COBRADOR).not.toContain(PERMISSIONS.SALES_CREATE);
  });
});
