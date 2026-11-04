import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { CreateMasterPayload, MasterType, TicketMaster, UpdateMasterPayload } from '../types';

export const masterApi = {
  async list(type?: MasterType, parentId?: string): Promise<TicketMaster[]> {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (parentId) params.parentId = parentId;

    const { data } = await api.get<ApiResponse<TicketMaster[]>>('/masters', { params });
    return data.data;
  },

  async get(id: string): Promise<TicketMaster> {
    const { data } = await api.get<ApiResponse<TicketMaster>>(`/masters/${id}`);
    return data.data;
  },

  async create(payload: CreateMasterPayload): Promise<TicketMaster> {
    const { data } = await api.post<ApiResponse<TicketMaster>>('/masters', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateMasterPayload): Promise<TicketMaster> {
    const { data } = await api.put<ApiResponse<TicketMaster>>(`/masters/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/masters/${id}`);
  },
};
