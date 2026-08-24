import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  orgId?: string;
  status?: string;
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
        // Store token in both localStorage (for API client reads) and a cookie (for middleware)
        if (typeof window !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.setItem('rf_access_token', accessToken);
          // httpOnly can't be set from JS — use a JS cookie with a 7-day expiry
          document.cookie = `rf_landlord_token=${accessToken}; path=/; max-age=604800; samesite=lax${secure}`;
        }
        set({ user, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.removeItem('rf_access_token');
          document.cookie = `rf_landlord_token=; path=/; max-age=0; samesite=lax${secure}`;
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'rf_auth_landlord',
      // Use localStorage so auth survives tab closes and page refreshes
      storage: createJSONStorage(() => localStorage),
      // Persist accessToken so the API client can read it without needing a cookie re-read
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // After rehydrating from localStorage, sync the cookie and localStorage token
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && typeof window !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.setItem('rf_access_token', state.accessToken);
          document.cookie = `rf_landlord_token=${state.accessToken}; path=/; max-age=604800; samesite=lax${secure}`;
        }
      },
    },
  ),
);
