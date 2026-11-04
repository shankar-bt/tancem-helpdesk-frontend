import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '../api/departmentApi';
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '../types';

export const departmentKeys = {
  all: ['departments'] as const,
  detail: (id: string) => ['departments', 'detail', id] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: () => departmentApi.list(),
  });
}

export function useDepartment(id: string | undefined) {
  return useQuery({
    queryKey: departmentKeys.detail(id ?? ''),
    queryFn: () => departmentApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) => departmentApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
  });
}
