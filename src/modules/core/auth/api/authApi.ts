import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { AuthResult, LoginPayload, RegisterPayload } from '../types';

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>('/auth/login', payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const { data } = await api.post<ApiResponse<AuthResult>>('/auth/register', payload);
    return data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },
};
