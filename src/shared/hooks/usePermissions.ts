import { useAuthStore } from '@/stores/authStore';
import { isUserAdmin } from '@/shared/utils/roles';

/**
 * Normalizes an identifier for flexible, dynamic comparison:
 * e.g. "User Management" -> "users", "Category Masters" -> "masters", "Roles & Permissions" -> "roles"
 */
function normalizeIdentifier(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Dynamic permission evaluator:
 * Dynamically resolves permissions, module scopes, and actions without hardcoded static lists.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = isUserAdmin(user);
  const permissions: string[] = user?.permissions ?? [];

  /**
   * Dynamically checks if the user has any of the requested permissions.
   * Matches:
   * 1. Exact slug match
   * 2. Case-insensitive / normalized match
   * 3. Prefix matching: target "tickets" matches "tickets:view", "tickets:create", etc.
   * 4. Broad management match: user having "tickets:manage" or "tickets" grants all actions on tickets.
   */
  const hasPermission = (...perms: string[]): boolean => {
    if (isAdmin) return true;
    if (!permissions.length) return false;

    return perms.some((perm) => {
      if (permissions.includes(perm)) return true;

      const normTarget = normalizeIdentifier(perm);

      return permissions.some((userPerm) => {
        const normUser = normalizeIdentifier(userPerm);
        if (normUser === normTarget) return true;

        // Prefix match: e.g. target="tickets" matches "tickets_view" or "tickets:view"
        if (normUser.startsWith(`${normTarget}_`) || normUser.startsWith(`${normTarget}:`)) {
          return true;
        }

        // Module and action comparison
        const [targetMod, targetAct] = normTarget.split(/[:_]/);
        const [userMod, userAct] = normUser.split(/[:_]/);

        if (targetMod && userMod && targetMod === userMod) {
          if (userAct === 'manage' || userAct === 'all' || !userAct || userAct === targetAct) {
            return true;
          }
        }

        return false;
      });
    });
  };

  /**
   * Dynamically checks if the user can perform a specific action on a module.
   * e.g. can('view', 'tickets'), can('create', 'departments'), can('delete', 'roles')
   * Purely dynamic — operates on any module name and action without hardcoded switches.
   */
  const can = (action: string, module: string): boolean => {
    if (isAdmin) return true;
    if (!permissions.length) return false;

    const normMod = normalizeIdentifier(module);
    const normAct = normalizeIdentifier(action);

    return permissions.some((userPerm) => {
      const normUser = normalizeIdentifier(userPerm);

      // Exact slug match: e.g. "tickets_view" or "tickets:view"
      if (normUser === `${normMod}_${normAct}` || normUser === `${normMod}:${normAct}`) {
        return true;
      }

      // Broad management match: e.g. "tickets_manage", "tickets_all", or "tickets"
      if (normUser === `${normMod}_manage` || normUser === `${normMod}_all` || normUser === normMod) {
        return true;
      }

      // Dynamic sub-part match
      const parts = userPerm.toLowerCase().split(/[:_]/);
      if (parts.length >= 2) {
        const pMod = normalizeIdentifier(parts[0]);
        const pAct = normalizeIdentifier(parts.slice(1).join('_'));

        if (pMod === normMod) {
          if (pAct === normAct || pAct === 'manage' || pAct === 'all') {
            return true;
          }
        }
      }

      return false;
    });
  };

  return {
    isAdmin,
    permissions,
    hasPermission,
    can,
  };
}
