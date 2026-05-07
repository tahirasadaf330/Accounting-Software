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

function getTokens() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('auth');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed.state || null;
  } catch {
    return null;
  }
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

  const auth = getTokens();
  const headers: Record<string, string> = {
    ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  };

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(url, { ...rest, headers });

  if (response.status === 401 && auth?.refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    if (refreshRes.ok) {
      const tokens = await refreshRes.json();
      const stored = JSON.parse(localStorage.getItem('auth') || '{}');
      stored.state = { ...stored.state, ...tokens };
      localStorage.setItem('auth', JSON.stringify(stored));

      headers.Authorization = `Bearer ${tokens.accessToken}`;
      const retryResponse = await fetch(url, { ...rest, headers });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }));
        throw new ApiError(retryResponse.status, error.message, error.errors);
      }

      return retryResponse.json();
    } else {
      localStorage.removeItem('auth');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message, error.errors);
  }

  if (response.status === 204) return {} as T;
  return response.json();
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

    const auth = getTokens();
    const headers: Record<string, string> = {};
    if (auth?.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(response.status, error.message, error.errors);
    }

    return response.json();
  },

  postFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const auth = getTokens();
    const headers: Record<string, string> = {};
    if (auth?.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(response.status, error.message, error.errors);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  },

  getFileUrl: async (endpoint: string): Promise<string> => {
    const auth = getTokens();
    const headers: Record<string, string> = {};
    if (auth?.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to load file' }));
      throw new ApiError(response.status, error.message, error.errors);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  downloadFile: async (endpoint: string, filename: string): Promise<void> => {
    const auth = getTokens();
    const headers: Record<string, string> = {};
    if (auth?.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new ApiError(response.status, error.message, error.errors);
    }

    const blob = await response.blob();
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
