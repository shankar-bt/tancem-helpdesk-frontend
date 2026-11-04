import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@/modules/core/auth/types';
import type { ApiResponse } from '@/shared/types/api.types';
import { API_URL } from '@/shared/utils/constants';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token');

  // Plain axios: this call must not go through the interceptors below.
  const res = await axios.post<ApiResponse<AuthTokens>>(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    { withCredentials: true },
  );
  setTokens(res.data.data);
  return res.data.data.accessToken;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        // Concurrent 401s share a single refresh request.
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        // ProtectedRoute redirects to /login once the session is cleared.
        useAuthStore.getState().clearSession();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
