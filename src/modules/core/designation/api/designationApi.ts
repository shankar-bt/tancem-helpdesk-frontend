import { api } from '@/lib/api';
import type { ApiResponse, PaginationMeta } from '@/shared/types/api.types';
import type {
  CreateDesignationPayload,
  Designation,
  ListDesignationsParams,
  UpdateDesignationPayload,
} from '../types';

export interface DesignationListResult {
  items: Designation[];
  meta: PaginationMeta;
}

export const designationApi = {
  async list(params: ListDesignationsParams): Promise<DesignationListResult> {
    const { data } = await api.get<ApiResponse<Designation[]>>('/designations', {
      params: { page: params.page, limit: params.limit, search: params.search || undefined },
    });
    return {
      items: data.data,
      meta: data.meta ?? { page: params.page, limit: params.limit, total: data.data.length, totalPages: 1 },
    };
  },

  async get(id: string): Promise<Designation> {
    const { data } = await api.get<ApiResponse<Designation>>(`/designations/${id}`);
    return data.data;
  },

  async create(payload: CreateDesignationPayload): Promise<Designation> {
    const { data } = await api.post<ApiResponse<Designation>>('/designations', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateDesignationPayload): Promise<Designation> {
    const { data } = await api.put<ApiResponse<Designation>>(`/designations/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/designations/${id}`);
  },
};
