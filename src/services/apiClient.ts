/**
 * Centralized API client conforming to:
 * - Base URL: http://localhost:3000 (configurable via VITE_API_BASE_URL)
 * - Cookie authentication (`credentials: "include"`)
 * - CSRF protection: calls GET /auth/csrf at boot, attaches X-CSRF-Token on mutations
 * - Normalized error handling (RFC 7807)
 */

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path?: string;
}

export class ApiError extends Error {
  statusCode: number;
  errorTitle: string;
  messages: string[];
  timestamp: string;
  path?: string;

  constructor(res: ApiErrorResponse) {
    const msg = Array.isArray(res.message) ? res.message.join(', ') : res.message;
    super(msg);
    this.name = 'ApiError';
    this.statusCode = res.statusCode;
    this.errorTitle = res.error;
    this.messages = Array.isArray(res.message) ? res.message : [res.message];
    this.timestamp = res.timestamp;
    this.path = res.path;
  }
}

class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;
  private csrfPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  // Fetch CSRF token once
  public async getCsrfToken(): Promise<string | null> {
    if (this.csrfToken) return this.csrfToken;
    if (this.csrfPromise) return this.csrfPromise;

    this.csrfPromise = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/auth/csrf`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          this.csrfToken = data.token || data.csrfToken || null;
          return this.csrfToken;
        }
      } catch {
        // Backend might be offline during development or mocking
      }
      return null;
    })();

    return this.csrfPromise;
  }

  public setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(
      (options.method || 'GET').toUpperCase()
    );

    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (isMutation) {
      const csrf = await this.getCsrfToken();
      if (csrf) {
        headers.set('X-CSRF-Token', csrf);
      }
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Ensure HttpOnly cookies are attached
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err: unknown) {
      throw new ApiError({
        statusCode: 0,
        error: 'Network Error',
        message: 'Could not connect to server. Please check your network connection.',
        timestamp: new Date().toISOString(),
        path: endpoint,
      });
    }

    // Handle 401 token refresh if needed
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry original request once
        response = await fetch(url, config);
      }
    }

    if (!response.ok) {
      let errorData: ApiErrorResponse;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          statusCode: response.status,
          error: response.statusText,
          message: `Request failed with status ${response.status}`,
          timestamp: new Date().toISOString(),
          path: endpoint,
        };
      }
      throw new ApiError(errorData);
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Convenient HTTP helpers
  public get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
