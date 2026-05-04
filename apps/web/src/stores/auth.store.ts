import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string | null;
  mfaEnabled?: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  status?: string;
  hasLogo?: boolean;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ mfaRequired?: boolean }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) => Promise<void>;
  setupTenant: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      login: async (email, password, mfaCode?) => {
        const res = await api.post<any>('/auth/login', { email, password, mfaCode });

        if (res.mfaRequired) {
          return { mfaRequired: true };
        }

        set({
          user: res.user,
          tenant: res.tenant,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });

        return {};
      },

      register: async (data) => {
        const res = await api.post<any>('/auth/register', data);

        set({
          user: res.user,
          tenant: res.tenant,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });
      },

      setupTenant: async (data) => {
        const res = await api.post<any>('/tenant/setup', data);
        const currentTenant = get().tenant;
        set({
          tenant: {
            ...currentTenant!,
            ...res.tenant,
            status: res.tenant.status,
          },
        });
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch {
          // Ignore logout errors
        }
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      fetchProfile: async () => {
        const res = await api.get<any>('/auth/profile');
        set({
          user: {
            id: res.id,
            email: res.email,
            firstName: res.firstName,
            lastName: res.lastName,
            role: res.role,
            tenantId: res.tenantId,
            mfaEnabled: res.mfaEnabled,
          },
          tenant: res.tenant,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
