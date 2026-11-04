import { create } from 'zustand';
import type { AuthResult, AuthTokens } from '@/modules/core/auth/types';
import type { User } from '@/modules/core/user/types';
import { storage } from '@/shared/utils/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (result: AuthResult) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
}

const initialTokens = storage.getTokens();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialTokens ? storage.getUser() : null,
  accessToken: initialTokens?.accessToken ?? null,
  refreshToken: initialTokens?.refreshToken ?? null,

  setSession: ({ user, tokens }) => {
    storage.setTokens(tokens);
    storage.setUser(user);
    set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },

  setTokens: (tokens) => {
    storage.setTokens(tokens);
    set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  },

  setUser: (user) => {
    storage.setUser(user);
    set({ user });
  },

  clearSession: () => {
    storage.clear();
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
