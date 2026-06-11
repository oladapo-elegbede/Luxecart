import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tokenStorage } from '@/lib/api-client';

/**
 * Auth Store (Zustand).
 *
 * Holds the currently logged-in user.
 * Anywhere in the app, components can:
 *   - Read user info: const user = useAuthStore((s) => s.user);
 *   - Check auth state: const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
 *   - Update on login: useAuthStore.getState().setAuth(user, token);
 *   - Logout: useAuthStore.getState().logout();
 *
 * The token is stored in localStorage via tokenStorage (separate from this store).
 * The USER object is persisted to localStorage via Zustand's persist middleware.
 *
 * WHY SEPARATE TOKEN AND USER?
 * - Token: Needed by Axios interceptor (which doesn't run in React)
 * - User: Needed by components (which subscribe to changes)
 *
 * They are kept in sync by setAuth() and logout().
 */

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN';
  isVerified: boolean;
  avatarUrl: string | null;
  phone: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isHydrated: boolean;

  // Derived helpers
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;

  // Actions
  setAuth: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  setHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isHydrated: false,

      isAuthenticated: () => get().user !== null,
      isAdmin: () => get().user?.role === 'ADMIN',

      setAuth: (user, accessToken) => {
        tokenStorage.set(accessToken);
        set({ user });
      },

      setUser: (user) => set({ user }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      logout: () => {
        tokenStorage.clear();
        set({ user: null });
      },
    }),
    {
      name: 'luxecart-auth',
      storage: createJSONStorage(() => {
        // SSR-safe storage: returns no-op storage on server
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({ user: state.user }), // Only persist user
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);