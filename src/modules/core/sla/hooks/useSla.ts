import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slaApi } from '../api/slaApi';
import type { UpdateSlaPolicyPayload } from '../types';

export const slaKeys = {
  all: ['sla-policies'] as const,
};

export function useSlaPolicies() {
  return useQuery({
    queryKey: slaKeys.all,
    queryFn: () => slaApi.list(),
  });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSlaPolicyPayload }) =>
      slaApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: slaKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
