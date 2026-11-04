import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../api/ticketApi';
import type {
  AddCommentPayload,
  AssignTicketPayload,
  CreateTicketPayload,
  ListTicketsParams,
  UpdateTicketStatusPayload,
} from '../types';

export function useTicketStats() {
  return useQuery({
    queryKey: ['tickets', 'stats'],
    queryFn: () => ticketApi.getStats(),
  });
}

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (params: ListTicketsParams) => ['tickets', 'list', params] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
  comments: (id: string) => ['tickets', 'comments', id] as const,
};

export function useTickets(params: ListTicketsParams) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => ticketApi.list(params),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(id ?? ''),
    queryFn: () => ticketApi.get(id as string),
    enabled: Boolean(id),
    refetchOnWindowFocus: false,
  });
}

export function useTicketComments(ticketId: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.comments(ticketId ?? ''),
    queryFn: () => ticketApi.listComments(ticketId as string),
    enabled: Boolean(ticketId),
    refetchOnWindowFocus: false,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateTicketStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTicketStatusPayload) => ticketApi.updateStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useAssignTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignTicketPayload) => ticketApi.assign(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCommentPayload) => ticketApi.addComment(ticketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useTicketHistory(ticketId: string | null) {
  return useQuery({
    queryKey: ['tickets', 'history', ticketId],
    queryFn: () => ticketApi.getHistory(ticketId as string),
    enabled: Boolean(ticketId),
    refetchOnWindowFocus: false,
  });
}

export function useRateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, feedback }: { id: string; rating: number; feedback?: string }) =>
      ticketApi.rate(id, { rating, feedback }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'history', vars.id] });
    },
  });
}
