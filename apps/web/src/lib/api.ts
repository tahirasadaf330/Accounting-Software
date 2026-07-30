const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 'password' → form only · 'both' → form + Microsoft button · 'sso' → Microsoft only
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || 'password';

/**
 * The session lives in an httpOnly cookie on the API domain — JS cannot read it, so we simply
 * send credentials on every request. On a 401 (no session / expired 8h session) we send the
 * browser to log in again — straight to Microsoft in sso-only mode (silent re-auth if their
 * Microsoft session is alive), otherwise to the login page so the user picks a method —
 * unless already on a public page.
 */
function redirectToLogin(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/not-authorized')) return false;
  if (AUTH_MODE === 'sso') {
    const returnTo = encodeURIComponent(path + window.location.search);
    window.location.href = `${API_BASE}/auth/microsoft?returnTo=${returnTo}`;
  } else {
    window.location.href = '/login';
  }
  return true;
}

/** A promise that never resolves — used to halt callers while the browser navigates away. */
function pending<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...rest } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  };

  const response = await fetch(url, { ...rest, headers, credentials: 'include' });

  if (response.status === 401 && redirectToLogin()) {
    return pending<T>();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.errors);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

async function requestBlob(endpoint: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });

  if (response.status === 401 && redirectToLogin()) {
    return pending<Blob>();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to load file' }));
    throw new ApiError(response.status, error.message, error.errors);
  }

  return response.blob();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  uploadFiles: async <T>(endpoint: string, files: File[]): Promise<T> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401 && redirectToLogin()) {
      return pending<T>();
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(response.status, error.message, error.errors);
    }

    return response.json();
  },

  postFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401 && redirectToLogin()) {
      return pending<T>();
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(response.status, error.message, error.errors);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  },

  getFileUrl: async (endpoint: string): Promise<string> => {
    const blob = await requestBlob(endpoint);
    return URL.createObjectURL(blob);
  },

  downloadFile: async (endpoint: string, filename: string): Promise<void> => {
    const blob = await requestBlob(endpoint);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export { ApiError };
