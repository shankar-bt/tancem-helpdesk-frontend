import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { notificationApi } from '../api/notificationApi';

export const notificationKeys = {
  all: ['notifications'] as const,
  byUser: (userId?: string) => ['notifications', userId || 'anonymous'] as const,
};

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: notificationKeys.byUser(user?.id),
    queryFn: () => notificationApi.list(),
    enabled: Boolean(user?.id),
    refetchInterval: 15000,
    staleTime: 5000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useClearReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.clearRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
