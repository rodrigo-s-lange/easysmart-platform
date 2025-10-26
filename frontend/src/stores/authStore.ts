/**
 * Auth Store - Zustand
 * 
 * Gerencia estado de autenticação
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ✅ INTERFACE FORA DO CREATE
interface User {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (data: { user: User; tokens: { accessToken: string; refreshToken: string }; isAuthenticated: boolean }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

// ✅ STORE
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data) => {
        set({
          user: data.user,
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          isAuthenticated: data.isAuthenticated,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set((state) => ({
          ...state,
          accessToken,
          refreshToken,
        }));
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
