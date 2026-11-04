export const API_URL: string = import.meta.env.VITE_API_URL || '/api';


export const STORAGE_KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;
