import { api } from '@/lib/api';
import type { ApiResponse } from '@/shared/types/api.types';
import type { ChatMessageResponse } from '../types/chatbot.types';

export const chatbotApi = {
  async sendMessage(message: string): Promise<ChatMessageResponse> {
    const { data } = await api.post<ApiResponse<ChatMessageResponse>>('/chatbot/message', { message });
    return data.data;
  },
};
