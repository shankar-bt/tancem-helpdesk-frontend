import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { CreateRolePayload, PermissionGroup, Role, UpdateRolePayload } from '../types';

export const roleApi = {
  async list(): Promise<Role[]> {
    const { data } = await api.get<ApiResponse<Role[]>>('/roles');
    return data.data;
  },

  async get(id: string): Promise<Role> {
    const { data } = await api.get<ApiResponse<Role>>(`/roles/${id}`);
    return data.data;
  },

  async create(payload: CreateRolePayload): Promise<Role> {
    const { data } = await api.post<ApiResponse<Role>>('/roles', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateRolePayload): Promise<Role> {
    const { data } = await api.put<ApiResponse<Role>>(`/roles/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

  async listPermissions(): Promise<PermissionGroup[]> {
    const { data } = await api.get<ApiResponse<PermissionGroup[]>>('/roles/permissions');
    return data.data;
  },

  async assignPermissions(id: string, permissionIds: string[]): Promise<void> {
    await api.post(`/roles/${id}/permissions`, { permissionIds });
  },
};
