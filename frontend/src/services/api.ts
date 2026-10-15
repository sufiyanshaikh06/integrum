// Integrum Frontend API Client
// In-Memory Access Token + HttpOnly Refresh Cookie Session Architecture

let currentAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export class ApiError extends Error {
  statusCode: number;
  errors: any[];

  constructor(message: string, statusCode: number, errors: any[] = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

const BASE_URL = '/api/v1';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (currentAccessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Ensure HttpOnly refreshToken cookie is always sent and received
  };

  let res = await fetch(url, fetchOptions);

  // If 401 Unauthorized and not already refreshing, attempt silent refresh
  if (res.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const newToken = refreshJson?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            onRefreshed(newToken);
          } else {
            setAccessToken(null);
            onRefreshed(null);
          }
        } else {
          setAccessToken(null);
          onRefreshed(null);
        }
      } catch {
        setAccessToken(null);
        onRefreshed(null);
      } finally {
        isRefreshing = false;
      }
    }

    // Wait for the refresh to complete
    const retryToken = await new Promise<string | null>((resolve) => {
      addRefreshSubscriber((token) => resolve(token));
    });

    if (retryToken) {
      headers.set('Authorization', `Bearer ${retryToken}`);
      res = await fetch(url, { ...fetchOptions, headers });
    }
  }

  // Handle successful empty responses (e.g., 204 No Content)
  if (res.status === 204) {
    return null as T;
  }

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.message || (Array.isArray(data?.errors) && data.errors[0]?.message) || `HTTP Error ${res.status}`;
    throw new ApiError(errorMsg, res.status, data?.errors || []);
  }

  return (data && typeof data === 'object' && 'data' in data) ? data.data : data;
}

// ─────────────────────────────────────────────────────────────
// Typed API Services
// ─────────────────────────────────────────────────────────────

export const authApi = {
  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    return apiRequest('/auth/register', { method: 'POST', body: data as any });
  },

  async login(credentials: { email: string; password: string }) {
    const result = await apiRequest<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: credentials as any,
    });
    setAccessToken(result.accessToken);
    return result;
  },

  async restoreSession() {
    const refreshResult = await apiRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    if (refreshResult?.accessToken) {
      setAccessToken(refreshResult.accessToken);
      const userProfile = await apiRequest('/users/me');
      return { user: userProfile, accessToken: refreshResult.accessToken };
    }
    throw new ApiError('No active session', 401);
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  },

  async getProfile() {
    return apiRequest('/users/me');
  },
};

export const academicApi = {
  async getSemesters() {
    return apiRequest<any[]>('/semesters');
  },

  async createSemester(data: { name: string; startDate: string; endDate: string }) {
    return apiRequest('/semesters', { method: 'POST', body: data as any });
  },

  async getSubjects() {
    return apiRequest<any[]>('/subjects');
  },

  async createSubject(data: { semesterId: string; name: string; code?: string; credits?: number }) {
    return apiRequest('/subjects', { method: 'POST', body: data as any });
  },

  async getAssignments() {
    return apiRequest<any[]>('/assignments');
  },

  async createAssignment(data: {
    subjectId: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'PENDING' | 'SUBMITTED' | 'GRADED';
  }) {
    return apiRequest('/assignments', { method: 'POST', body: data as any });
  },

  async updateAssignment(id: string, data: Partial<{
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'PENDING' | 'SUBMITTED' | 'GRADED';
  }>) {
    return apiRequest(`/assignments/${id}`, { method: 'PATCH', body: data as any });
  },

  async deleteAssignment(id: string) {
    return apiRequest(`/assignments/${id}`, { method: 'DELETE' });
  },
};

export const taskApi = {
  async getTasks() {
    return apiRequest<any[]>('/tasks');
  },

  async createTask(data: {
    title: string;
    description?: string;
    dueDate?: string | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }) {
    return apiRequest('/tasks', { method: 'POST', body: data as any });
  },

  async updateTask(id: string, data: Partial<{
    title: string;
    description?: string | null;
    dueDate?: string | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }>) {
    return apiRequest(`/tasks/${id}`, { method: 'PATCH', body: data as any });
  },

  async deleteTask(id: string) {
    return apiRequest(`/tasks/${id}`, { method: 'DELETE' });
  },
};

export const reminderApi = {
  async getReminders() {
    return apiRequest<any[]>('/reminders');
  },
};
