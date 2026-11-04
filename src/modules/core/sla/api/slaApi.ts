import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { SlaPolicy, UpdateSlaPolicyPayload } from '../types';

export const slaApi = {
  async list(): Promise<SlaPolicy[]> {
    const { data } = await api.get<ApiResponse<SlaPolicy[]>>('/sla');
    return data.data;
  },

  async update(id: string, payload: UpdateSlaPolicyPayload): Promise<SlaPolicy> {
    const { data } = await api.put<ApiResponse<SlaPolicy>>(`/sla/${id}`, payload);
    return data.data;
  },
};
