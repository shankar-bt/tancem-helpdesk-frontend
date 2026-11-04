import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../api/roleApi';
import type { CreateRolePayload, UpdateRolePayload } from '../types';

export const roleKeys = {
  all: ['roles'] as const,
  detail: (id: string) => ['roles', 'detail', id] as const,
  permissions: ['roles', 'permissions'] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: () => roleApi.list(),
  });
}

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: roleKeys.detail(id ?? ''),
    queryFn: () => roleApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions,
    queryFn: () => roleApi.listPermissions(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => roleApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useAssignPermissions(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionIds: string[]) => roleApi.assignPermissions(id, permissionIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
