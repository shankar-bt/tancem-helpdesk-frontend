import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { designationApi } from '../api/designationApi';
import type { CreateDesignationPayload, ListDesignationsParams, UpdateDesignationPayload } from '../types';

export const designationKeys = {
  all: ['designations'] as const,
  list: (params: ListDesignationsParams) => ['designations', 'list', params] as const,
  detail: (id: string) => ['designations', 'detail', id] as const,
};

export function useDesignations(params: ListDesignationsParams) {
  return useQuery({
    queryKey: designationKeys.list(params),
    queryFn: () => designationApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDesignation(id: string | undefined) {
  return useQuery({
    queryKey: designationKeys.detail(id ?? ''),
    queryFn: () => designationApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDesignationPayload) => designationApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designationKeys.all }),
  });
}

export function useUpdateDesignation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDesignationPayload) => designationApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designationKeys.all }),
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => designationApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: designationKeys.all }),
  });
}
