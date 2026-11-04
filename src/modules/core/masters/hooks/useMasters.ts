import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterApi } from '../api/masterApi';
import type { CreateMasterPayload, MasterType, UpdateMasterPayload } from '../types';

export const masterKeys = {
  all: ['masters'] as const,
  byType: (type?: MasterType, parentId?: string) => ['masters', 'type', type, 'parent', parentId] as const,
  detail: (id: string) => ['masters', 'detail', id] as const,
};

export function useMasters(type?: MasterType, parentId?: string) {
  return useQuery({
    queryKey: masterKeys.byType(type, parentId),
    queryFn: () => masterApi.list(type, parentId),
  });
}

export function useCreateMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMasterPayload) => masterApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.all }),
  });
}

export function useUpdateMaster(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMasterPayload) => masterApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.all }),
  });
}

export function useDeleteMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => masterApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterKeys.all }),
  });
}
