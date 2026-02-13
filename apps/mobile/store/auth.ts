import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const AUTH_STORAGE_KEY = "maradi-auth-storage";

export type AuthRole = "admin" | "user" | "manager" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: AuthRole;
  priceList?: string | null; // A | B | C for tier pricing
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: AuthRole | null;
  isLoading: boolean;
  isHydrated: boolean;
  // Actions
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

/**
 * Auth store using Zustand with AsyncStorage persistence.
 * Handles user, token, role storage and auto-redirect based on auth state.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isLoading: false,
      isHydrated: false,

      setAuth: async (user: AuthUser, token: string) => {
        set({
          user,
          token,
          role: user.role,
        });
      },

      logout: async () => {
        set({
          user: null,
          token: null,
          role: null,
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
      }),
      onRehydrateStorage: () => () => {
        // Called when rehydration completes - use setTimeout to avoid calling setState during render
        setTimeout(() => {
          useAuthStore.setState({ isHydrated: true });
        }, 0);
      },
    },
  ),
);
