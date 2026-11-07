import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import type {
  ApiSettings,
  AssistantMode,
  AuthSessionResponse,
  AuthUser,
  ChatResponse,
  ConversationDetail,
  ConversationsResponse,
  DocumentsResponse,
  HealthResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from './types';

import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
} from './auth';

import { ApiError } from './errors';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

const SETTINGS_KEY = 'nexa-api-settings';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

// -----------------------------------------------------------------------------
// Optional legacy API-key settings. API URL is environment-only.
// -----------------------------------------------------------------------------

export function getSettings(): ApiSettings {
  if (typeof window === 'undefined') {
    return { apiKey: '' };
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { apiKey: '' };

    const parsed = JSON.parse(raw) as Partial<ApiSettings>;
    return { apiKey: parsed.apiKey || '' };
  } catch {
    return { apiKey: '' };
  }
}

export function saveSettings(settings: ApiSettings): void {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ apiKey: settings.apiKey.trim() }),
  );

  window.dispatchEvent(new Event('nexa-settings-updated'));
}

// -----------------------------------------------------------------------------
// Axios instance
// -----------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60_000,
  headers: {
    Accept: 'application/json',
  },
});

function isUnsafeMethod(method?: string): boolean {
  return ['post', 'put', 'patch', 'delete'].includes(
    (method || 'get').toLowerCase(),
  );
}

function isAuthEndpoint(url?: string): boolean {
  return [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/csrf',
    '/auth/logout',
  ].some(endpoint => (url || '').includes(endpoint));
}

function dispatchAuthExpired(): void {
  clearCsrfToken();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('nexa-auth-expired'));
  }
}

function normalizeAxiosError(error: unknown): unknown {
  if (!axios.isAxiosError(error)) return error;

  const response = error.response;
  if (!response) {
    return new Error('API_UNREACHABLE');
  }

  const body = response.data as
    | { detail?: string | { message?: string } }
    | undefined;

  const detail =
    typeof body?.detail === 'string'
      ? body.detail
      : body?.detail?.message || `HTTP_${response.status}`;

  return new ApiError(detail, response.status);
}

// Backend checks the CSRF cookie/header pair on unsafe requests.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.withCredentials = true;

    if (isUnsafeMethod(config.method)) {
      const token = getCsrfToken();

      if (token) {
        config.headers.set('X-CSRF-Token', token);
      }
    }

    // Keep compatibility with optional legacy API-key integrations.
    const apiKey = getSettings().apiKey;
    if (apiKey) {
      config.headers.set('X-API-Key', apiKey);
    }

    return config;
  },
);

// One shared refresh operation prevents concurrent refresh-token rotations.
async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrf = getCsrfToken();

      const response = await axios.post<{
        status: string;
        expires_in: number;
        csrf_token: string;
      }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: csrf
            ? { 'X-CSRF-Token': csrf }
            : {},
        },
      );

      setCsrfToken(response.data.csrf_token);
    })()
      .catch(error => {
        dispatchAuthExpired();
        throw normalizeAxiosError(error);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !isAuthEndpoint(config.url)
    ) {
      config._retry = true;

      try {
        await refreshSession();
        return apiClient(config);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(normalizeAxiosError(error));
  },
);

// -----------------------------------------------------------------------------
// API methods
// -----------------------------------------------------------------------------

export const api = {
  // Restore the in-memory CSRF token after a browser reload.
  csrf: async (): Promise<string> => {
    const response = await apiClient.get<{ csrf_token: string }>('/auth/csrf');
    setCsrfToken(response.data.csrf_token);
    return response.data.csrf_token;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    // Backend creates the account, creates a session and sets cookies.
    const response = await apiClient.post<RegisterResponse>(
      '/auth/register',
      payload,
    );

    setCsrfToken(response.data.csrf_token);
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthSessionResponse> => {
    const response = await apiClient.post<AuthSessionResponse>(
      '/auth/login',
      payload,
    );

    setCsrfToken(response.data.csrf_token);
    return response.data;
  },

  me: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Request interceptor adds X-CSRF-Token. Only clear the in-memory CSRF
    // value after the backend confirms revocation and expires its cookies.
    await apiClient.post('/auth/logout');
    clearCsrfToken();
  },

  refresh: refreshSession,

  health: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },

  documents: async (): Promise<DocumentsResponse> => {
    const response = await apiClient.get<DocumentsResponse>('/documents');
    return response.data;
  },

  upload: async (file: File) => {
    const body = new FormData();
    body.append('file', file);

    const response = await apiClient.post<{
      filename: string;
      chunks: number;
      status: string;
    }>('/upload', body);

    return response.data;
  },

  removeDocument: async (filename: string) => {
    const response = await apiClient.delete<{
      filename: string;
      chunks_deleted: number;
      status: string;
    }>(`/documents/${encodeURIComponent(filename)}`);

    return response.data;
  },

  conversations: async (limit = 50): Promise<ConversationsResponse> => {
    const response = await apiClient.get<ConversationsResponse>(
      `/conversations?limit=${limit}`,
    );
    return response.data;
  },

  conversation: async (id: string): Promise<ConversationDetail> => {
    const response = await apiClient.get<ConversationDetail>(
      `/conversations/${encodeURIComponent(id)}`,
    );
    return response.data;
  },

  deleteConversation: async (id: string) => {
    const response = await apiClient.delete<{
      status: string;
      conversation_id: string;
    }>(`/conversations/${encodeURIComponent(id)}`);

    return response.data;
  },

  chat: async (
    question: string,
    mode: AssistantMode,
    conversationId?: string,
  ): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', {
      question,
      mode,
      conversation_id: conversationId ?? null,
    });

    return response.data;
  },

  /**
   * Streaming uses Axios' XHR download-progress events so it still passes
   * through the same cookie, CSRF and 401-refresh interceptors as other APIs.
   */
  stream: async (
    question: string,
    onChunk: (chunk: string) => void,
    conversationId?: string,
    signal?: AbortSignal,
  ): Promise<{ conversationId?: string }> => {
    let processedLength = 0;
    let pendingText = '';
    let streamError: string | null = null;

    const consume = (text: string, final = false) => {
      if (text.length > processedLength) {
        pendingText += text.slice(processedLength);
        processedLength = text.length;
      }

      const markerIndex = pendingText.indexOf('[LLM_ERROR:');

      if (markerIndex >= 0) {
        streamError = pendingText.slice(markerIndex);
        pendingText = pendingText.slice(0, markerIndex);
      }

      // Hold a short suffix so an error marker split across XHR progress
      // events is not accidentally rendered as assistant text.
      const safeLength = final
        ? pendingText.length
        : Math.max(0, pendingText.length - 12);

      if (safeLength > 0) {
        onChunk(pendingText.slice(0, safeLength));
        pendingText = pendingText.slice(safeLength);
      }
    };

    const response = await apiClient.post<string>(
      '/chat-stream',
      {
        question,
        mode: 'rag',
        conversation_id: conversationId ?? null,
      },
      {
        responseType: 'text',
        signal,
        onDownloadProgress: progressEvent => {
          const xhr = progressEvent.event?.target as XMLHttpRequest | undefined;

          if (xhr?.responseText) {
            consume(xhr.responseText);
          }
        },
      },
    );

    // Flush any final bytes that arrived after the last progress callback.
    if (typeof response.data === 'string') {
      consume(response.data, true);
    }

    if (streamError) {
      throw new Error(streamError.trim());
    }

    const conversationHeader =
      response.headers['x-conversation-id'];

    return {
      conversationId:
        typeof conversationHeader === 'string'
          ? conversationHeader
          : undefined,
    };
  },
};
