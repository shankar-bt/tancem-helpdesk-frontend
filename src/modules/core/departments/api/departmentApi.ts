import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { CreateDepartmentPayload, Department, UpdateDepartmentPayload } from '../types';

export const departmentApi = {
  async list(): Promise<Department[]> {
    const { data } = await api.get<ApiResponse<Department[]>>('/departments');
    return data.data;
  },

  async get(id: string): Promise<Department> {
    const { data } = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return data.data;
  },

  async create(payload: CreateDepartmentPayload): Promise<Department> {
    const { data } = await api.post<ApiResponse<Department>>('/departments', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateDepartmentPayload): Promise<Department> {
    const { data } = await api.put<ApiResponse<Department>>(`/departments/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
};
