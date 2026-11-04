import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { paths } from '@/app/paths';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '../api/authApi';
import type { LoginPayload, RegisterPayload } from '../types';

function useRedirectTarget(): string {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  return from ?? paths.dashboard;
}

export function useLogin() {
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (result) => {
      setSession(result);
      navigate(target, { replace: true });
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (result) => {
      setSession(result);
      navigate(paths.dashboard, { replace: true });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    const { refreshToken, clearSession } = useAuthStore.getState();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // The session is cleared locally even if the server is unreachable.
    } finally {
      clearSession();
      queryClient.clear();
      window.location.href = paths.login;
    }
  };
}
