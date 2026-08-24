import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AdminUser {
  id: string; email: string; role: string; firstName: string; lastName: string;
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  clearAuth: () => void;
}

export const useAdminStore = create<AdminAuthState>()(
  persist(
    set => ({
      user: null, isAuthenticated: false,
      setAuth: (user, token) => {
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        localStorage.setItem('rf_admin_token', token);
        document.cookie = `rf_admin_token=${token}; path=/; max-age=86400; samesite=lax${secure}`;
        set({ user, isAuthenticated: true });
      },
      clearAuth: () => {
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
        localStorage.removeItem('rf_admin_token');
        document.cookie = `rf_admin_token=; path=/; max-age=0; samesite=lax${secure}`;
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'rf_admin_auth', storage: createJSONStorage(() => sessionStorage), partialize: s => ({ user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
);
