import { useAuthStore } from '@/stores/authStore';

const MODULE_PERMISSIONS: Record<string, string[]> = {
  dashboard: ['dashboard:view', 'Dashboard'],
  tickets: ['tickets:view', 'tickets:create', 'tickets:edit', 'tickets:delete', 'Ticket List'],
  create_ticket: ['tickets:create', 'Create Ticket'],
  departments: ['departments:view', 'departments:create', 'departments:edit', 'departments:delete', 'Departments'],
  users: ['users:view', 'users:create', 'users:edit', 'users:delete', 'User Management'],
  masters: ['masters:view', 'masters:create', 'masters:edit', 'masters:delete', 'Master'],
  roles: ['roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'Roles & Permissions'],
};

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions ?? [];

  const hasPermission = (...perms: string[]): boolean => {
    if (isAdmin) return true;
    return perms.some((perm) => {
      if (permissions.includes(perm)) return true;
      const lower = perm.toLowerCase();
      const aliases = MODULE_PERMISSIONS[lower];
      if (aliases && aliases.some((a) => permissions.includes(a))) return true;
      return false;
    });
  };

  const can = (action: 'view' | 'create' | 'edit' | 'delete', module: string): boolean => {
    if (isAdmin) return true;
    const directSlug = `${module}:${action}`;
    if (permissions.includes(directSlug)) return true;
    if (module === 'departments' && permissions.includes('Departments')) return true;
    if (module === 'users' && permissions.includes('User Management')) return true;
    if (module === 'masters' && permissions.includes('Master')) return true;
    if (module === 'tickets' && (permissions.includes('Ticket List') || permissions.includes('Create Ticket'))) return true;
    return false;
  };

  return {
    isAdmin,
    permissions,
    hasPermission,
    can,
  };
}
