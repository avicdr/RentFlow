import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  orgId?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.setItem('rf_access_token', accessToken);
          document.cookie = `rf_tenant_token=${accessToken}; path=/; max-age=604800; samesite=lax${secure}`;
        }
        set({ user, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.removeItem('rf_access_token');
          document.cookie = `rf_tenant_token=; path=/; max-age=0; samesite=lax${secure}`;
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'rf_auth_tenant',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && typeof window !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.setItem('rf_access_token', state.accessToken);
          document.cookie = `rf_tenant_token=${state.accessToken}; path=/; max-age=604800; samesite=lax${secure}`;
        }
      },
    },
  ),
);
