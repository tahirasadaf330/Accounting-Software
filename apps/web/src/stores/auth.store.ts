import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string | null;
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
  isAuthenticated: boolean;
  /** True once the initial /auth/profile check has completed (name kept for existing callers). */
  _hasHydrated: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ mfaRequired?: boolean }>;
  fetchProfile: () => Promise<void>;
  setupTenant: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

function toUser(res: any): User {
  return {
    id: res.id,
    email: res.email,
    firstName: res.firstName,
    lastName: res.lastName,
    role: res.role,
    tenantId: res.tenantId,
  };
}

/**
 * Auth state for Microsoft SSO. The session is an httpOnly cookie the browser sends automatically;
 * this store holds only the resolved profile. There is no login()/register() and no token storage —
 * unauthenticated requests are redirected to Microsoft by lib/api.ts.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  _hasHydrated: false,

  // Resolve the current session once on app load. On a protected route a 401 causes lib/api.ts
  // to redirect to Microsoft, so this promise never resolves there — which is the intended login.
  bootstrap: async () => {
    if (get()._hasHydrated) return;
    try {
      const res = await api.get<any>('/auth/profile');
      set({ user: toUser(res), tenant: res.tenant, isAuthenticated: true, _hasHydrated: true });
    } catch {
      set({ user: null, tenant: null, isAuthenticated: false, _hasHydrated: true });
    }
  },

  // Email/password login — active in AUTH_MODE 'password' and 'both' (403 in 'sso' mode).
  // The API sets the httpOnly session cookie; the response body carries user + tenant.
  login: async (email, password, mfaCode?) => {
    const res = await api.post<any>('/auth/login', { email, password, mfaCode });

    if (res.mfaRequired) {
      return { mfaRequired: true };
    }

    set({
      user: toUser(res.user),
      tenant: res.tenant,
      isAuthenticated: true,
      _hasHydrated: true,
    });

    return {};
  },

  fetchProfile: async () => {
    const res = await api.get<any>('/auth/profile');
    set({ user: toUser(res), tenant: res.tenant, isAuthenticated: true });
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
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout errors — clear local state regardless.
    }
    set({ user: null, tenant: null, isAuthenticated: false });
  },

  clearAuth: () => {
    set({ user: null, tenant: null, isAuthenticated: false });
  },
}));
