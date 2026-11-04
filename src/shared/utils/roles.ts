import type { Role } from '@/modules/core/roles/types';

export interface UserRoleLike {
  role?: string | null;
  roleId?: string | null;
}

export function getRoleFromUser(
  user: UserRoleLike | null | undefined,
  roles: Role[] | Map<string, Role> = []
): Role | undefined {
  if (!user?.roleId) return undefined;
  if (roles instanceof Map) {
    return roles.get(user.roleId);
  }
  return roles.find((r) => r.id === user.roleId);
}

export function getUserRoleSlug(
  user: UserRoleLike | null | undefined,
  roles?: Role[] | Map<string, Role>
): string {
  if (!user) return '';
  const roleObj = getRoleFromUser(user, roles);
  if (roleObj?.slug) return roleObj.slug.toLowerCase();
  return (user.role || '').toLowerCase();
}

export function isUserAdmin(
  user: UserRoleLike | null | undefined,
  roles?: Role[] | Map<string, Role>
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (roles) {
    const roleObj = getRoleFromUser(user, roles);
    if (roleObj) {
      const slug = (roleObj.slug || '').toLowerCase();
      const name = (roleObj.name || '').toLowerCase();
      if (
        slug === 'admin' ||
        slug === 'administrator' ||
        slug.includes('admin') ||
        name.includes('admin')
      ) {
        return true;
      }
    }
  }
  return false;
}

export function isUserManager(
  user: UserRoleLike | null | undefined,
  roles?: Role[] | Map<string, Role>
): boolean {
  if (!user) return false;
  if (user.role === 'manager') return true;
  if (roles) {
    const roleObj = getRoleFromUser(user, roles);
    if (roleObj) {
      const slug = (roleObj.slug || '').toLowerCase();
      const name = (roleObj.name || '').toLowerCase();
      if (slug === 'manager' || slug.includes('manager') || name.includes('manager')) {
        return true;
      }
    }
  }
  return false;
}

export function isUserAgent(
  user: UserRoleLike | null | undefined,
  roles?: Role[] | Map<string, Role>
): boolean {
  if (!user) return false;
  if (user.role === 'agent') return true;
  if (roles) {
    const roleObj = getRoleFromUser(user, roles);
    if (roleObj) {
      const slug = (roleObj.slug || '').toLowerCase();
      const name = (roleObj.name || '').toLowerCase();
      if (slug === 'agent' || slug.includes('agent') || name.includes('agent')) {
        return true;
      }
    }
  }
  return false;
}

export function getRoleLabel(
  user: UserRoleLike | null | undefined,
  roles?: Role[] | Map<string, Role>
): string {
  if (!user) return 'User';
  if (isUserAdmin(user, roles)) return 'Admin';
  if (isUserManager(user, roles)) return 'Manager';
  if (isUserAgent(user, roles)) return 'Support Agent';
  const roleObj = getRoleFromUser(user, roles);
  if (roleObj?.name) return roleObj.name;
  return 'User';
}

export function getUserTypeLabel(
  user: UserRoleLike | null | undefined,
  roles?: Role[] | Map<string, Role>
): string {
  if (!user) return 'Standard User';
  if (isUserAdmin(user, roles)) return 'System Administrator';
  if (isUserManager(user, roles)) return 'Department Manager';
  if (isUserAgent(user, roles)) return 'Helpdesk Support Staff';
  const roleObj = getRoleFromUser(user, roles);
  if (roleObj?.name) return roleObj.name;
  return 'Standard User';
}
