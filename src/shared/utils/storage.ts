import type { AuthTokens } from '@/modules/core/auth/types';
import type { User } from '@/modules/core/user/types';
import { STORAGE_KEYS } from './constants';

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const storage = {
  getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  },

  getUser(): User | null {
    return readJson<User>(STORAGE_KEYS.user);
  },

  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  },

  clear(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};
