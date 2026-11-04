import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { paths } from '@/app/paths';
import type { UserRole } from '@/modules/core/user/types';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  roles?: UserRole[];
}

/** Requires a signed-in user, optionally with one of the given roles. */
export default function ProtectedRoute({ roles }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!accessToken) return <Navigate to={paths.login} replace state={{ from: location }} />;
  if (roles && (!user || !roles.includes(user.role))) return <Navigate to={paths.dashboard} replace />;

  return <Outlet />;
}

/** Login and register pages: signed-in users are redirected to dashboard. */
export function GuestRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return accessToken ? <Navigate to={paths.dashboard} replace /> : <Outlet />;
}
