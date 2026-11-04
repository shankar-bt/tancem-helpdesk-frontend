import { api } from '@/lib/api';
import type { ApiResponse, PaginationMeta } from '@/shared/types/api.types';
import type {
  AddCommentPayload,
  AssignTicketPayload,
  CreateTicketPayload,
  ListTicketsParams,
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketHistoryEvent,
  UpdateTicketStatusPayload,
} from '../types';

export interface TicketStats {
  total: number;
  open: number;
  resolved: number;
  withinSla: number;
  atRisk: number;
  breached: number;
  complianceRate: number;
  averageRating?: number;
  ratingCount?: number;
  byStatus: {
    open: number;
    in_progress: number;
    pending_approval: number;
    resolved: number;
    closed: number;
    reopened: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  bySla: {
    withinSla: number;
    atRisk: number;
    breached: number;
    met: number;
  };
  byCategory: { name: string; count: number }[];
}

export interface TicketListResult {
  items: Ticket[];
  meta: PaginationMeta;
}

export const ticketApi = {
  async list(params: ListTicketsParams): Promise<TicketListResult> {
    const { data } = await api.get<ApiResponse<Ticket[]>>('/tickets', { params });
    return {
      items: data.data,
      meta: data.meta ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: data.data.length,
        totalPages: 1,
      },
    };
  },

  async getStats(): Promise<TicketStats> {
    const { data } = await api.get<ApiResponse<TicketStats>>('/tickets/stats');
    return data.data;
  },

  async get(id: string): Promise<Ticket> {
    const { data } = await api.get<ApiResponse<Ticket>>(`/tickets/${id}`);
    return data.data;
  },

  async create(payload: CreateTicketPayload): Promise<Ticket> {
    const { data } = await api.post<ApiResponse<Ticket>>('/tickets', payload);
    return data.data;
  },

  async updateStatus(id: string, payload: UpdateTicketStatusPayload): Promise<Ticket> {
    const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/status`, payload);
    return data.data;
  },

  async assign(id: string, payload: AssignTicketPayload): Promise<Ticket> {
    const { data } = await api.patch<ApiResponse<Ticket>>(`/tickets/${id}/assign`, payload);
    return data.data;
  },

  async listComments(ticketId: string): Promise<TicketComment[]> {
    const { data } = await api.get<ApiResponse<TicketComment[]>>(`/tickets/${ticketId}/comments`);
    return data.data;
  },

  async addComment(ticketId: string, payload: AddCommentPayload): Promise<TicketComment> {
    const { data } = await api.post<ApiResponse<TicketComment>>(`/tickets/${ticketId}/comments`, payload);
    return data.data;
  },

  async getHistory(ticketId: string): Promise<TicketHistoryEvent[]> {
    const { data } = await api.get<ApiResponse<TicketHistoryEvent[]>>(`/tickets/${ticketId}/history`);
    return data.data;
  },

  async uploadAttachments(files: File[]): Promise<TicketAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const { data } = await api.post<ApiResponse<TicketAttachment[]>>('/tickets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async rate(id: string, payload: { rating: number; feedback?: string }): Promise<Ticket> {
    const { data } = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/rate`, payload);
    return data.data;
  },
};
