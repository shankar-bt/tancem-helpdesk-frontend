import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { NotificationItem, NotificationListResponse } from '../types';

export const notificationApi = {
  async list(): Promise<NotificationListResponse> {
    const res = await api.get<ApiResponse<NotificationListResponse>>('/notifications');
    return res.data.data;
  },

  async markAsRead(id: string): Promise<NotificationItem> {
    const res = await api.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return res.data.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const res = await api.patch<ApiResponse<{ message: string }>>('/notifications/read-all');
    return res.data.data;
  },

  async clearRead(): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>('/notifications/clear-read');
    return res.data.data;
  },

  async clearAll(): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<{ message: string }>>('/notifications/clear-all');
    return res.data.data;
  },
};
