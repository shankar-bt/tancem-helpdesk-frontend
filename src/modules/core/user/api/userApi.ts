import { api } from '@/lib/api';
import type { ApiResponse, PaginationMeta } from '@/shared/types/api.types';
import type { CreateUserPayload, ListUsersParams, UpdateUserPayload, User } from '../types';

export interface UserListResult {
  items: User[];
  meta: PaginationMeta;
}

export const userApi = {
  async list(params: ListUsersParams): Promise<UserListResult> {
    const { data } = await api.get<ApiResponse<User[]>>('/users', {
      params: { page: params.page, limit: params.limit, search: params.search || undefined },
    });
    return {
      items: data.data,
      meta: data.meta ?? { page: params.page, limit: params.limit, total: data.data.length, totalPages: 1 },
    };
  },

  async get(id: string): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<ApiResponse<User>>('/users', payload);
    return data.data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
