import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStore, notifyLoggedOut } from '../../api/tokenStore';
import { refreshSession } from '../../api/refresh';
import { AdminApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const adminClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

adminClient.interceptors.request.use((config) => {
  const token = tokenStore.get('admin');
  config.headers.set('X-Auth-Scope', 'admin');
  if (token && !config.headers.has?.('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';

    // Nếu endpoint refresh tự nó bị 401 thì không retry
    if (url.includes('/api/auth/refresh')) {
      notifyLoggedOut('admin');
      return Promise.reject(normalizeAdminError(error));
    }

    if (status === 401 && config && !config._retried && tokenStore.get('admin')) {
      config._retried = true;
      config.headers.set('X-Auth-Scope', 'admin');
      try {
        const session = await refreshSession('admin');
        const headers = config.headers as unknown as {
          set?: (key: string, value: string) => void;
        };
        if (typeof headers?.set === 'function') {
          headers.set('Authorization', `Bearer ${session.accessToken}`);
        }
        return adminClient.request(config);
      } catch (refreshErr) {
        notifyLoggedOut('admin');
        return Promise.reject(normalizeAdminError(refreshErr));
      }
    }

    return Promise.reject(normalizeAdminError(error));
  }
);

export function normalizeAdminError(error: unknown): AdminApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const data = error.response?.data as
      | {
          // RFC 7807 ProblemDetail fields (current contract)
          type?: string;
          title?: string;
          status?: number;
          detail?: string;
          instance?: string;
          traceId?: string;
          errors?: Record<string, string>;
          // Legacy fields kept as safe fallbacks
          message?: string;
          error?: string;
          details?: Record<string, string>;
        }
      | undefined;
    // Prefer the RFC 7807 detail, then title; fall back to legacy message/error.
    const serverMessage = data?.detail || data?.title || data?.message || data?.error;
    const details = data?.errors ?? data?.details;

    if (status === 403) {
      return {
        status: 403,
        message: serverMessage || 'Bạn không có quyền thực hiện thao tác này.',
        details,
      };
    }

    if (status === 401) {
      return {
        status: 401,
        message: serverMessage || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
        details,
      };
    }

    if (status >= 500) {
      return {
        status,
        message: serverMessage || 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
        details,
      };
    }

    return {
      status,
      message: serverMessage || error.message || 'Đã xảy ra lỗi khi kết nối máy chủ.',
      details,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message,
    };
  }

  return {
    status: 0,
    message: 'Đã xảy ra lỗi không xác định.',
  };
}
